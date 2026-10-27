import type { PlanDocument, PlanRoomSeed } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import {
  createEmptyPlan,
  drawRoom,
  getRectCells,
  placeOpening,
  removeRoom,
} from '~bastion-game/model';
import {
  applyPlanChanges,
  createPlanSeedUpdate,
  getPlanDocVersion,
  isPlanDocSeeded,
  readPlanFromDoc,
  setPlanDocVersion,
} from '~bastion-game/model/plan-sync';

const LOCAL = 'local';

/**
 * Заготовка комнаты первого этажа.
 *
 * @param id Идентификатор.
 * @returns Заготовка.
 */
function seed(id: string): PlanRoomSeed {
  return { id, name: id, level: 0 };
}

/**
 * План с залом 3×3 и дверью на его северной стене.
 *
 * @returns План.
 */
function createHallPlan(): PlanDocument {
  const withHall = drawRoom(
    createEmptyPlan(),
    getRectCells({ x: 0, y: 0 }, { x: 2, y: 2 }),
    seed('hall'),
  );

  return placeOpening(
    withHall,
    0,
    { x: 1.5, y: 0.05 },
    { type: 'DOOR', kind: 'DOOR' },
  );
}

/**
 * Общий документ, заведённый из плана.
 *
 * @param document План.
 * @param version Версия.
 * @returns Документ.
 */
function createSeededDoc(document: PlanDocument, version: number): Y.Doc {
  const doc = new Y.Doc();

  Y.applyUpdate(doc, createPlanSeedUpdate(document, version));

  return doc;
}

/**
 * Обменивает два документа правками в обе стороны, как это делает сервер.
 *
 * @param first Документ.
 * @param second Документ.
 */
function exchange(first: Y.Doc, second: Y.Doc): void {
  Y.applyUpdate(
    second,
    Y.encodeStateAsUpdate(first, Y.encodeStateVector(second)),
  );

  Y.applyUpdate(
    first,
    Y.encodeStateAsUpdate(second, Y.encodeStateVector(first)),
  );
}

describe('общий документ плана', () => {
  it('план переживает запись и чтение без изменений', () => {
    const plan = createHallPlan();
    const doc = createSeededDoc(plan, 3);

    expect(readPlanFromDoc(doc)).toEqual(plan);
    expect(isPlanDocSeeded(doc)).toBe(true);
    expect(getPlanDocVersion(doc)).toBe(3);
  });

  it('одна версия, заведённая дважды, не задваивается', () => {
    const plan = createHallPlan();
    const first = createSeededDoc(plan, 3);
    const second = createSeededDoc(plan, 3);

    exchange(first, second);

    expect(readPlanFromDoc(first)).toEqual(plan);
    expect(Y.encodeStateVector(first)).toEqual(Y.encodeStateVector(second));
  });

  it('правки двух людей сливаются', () => {
    const plan = createHallPlan();
    const alice = createSeededDoc(plan, 1);
    const bob = createSeededDoc(plan, 1);

    const withKitchen = drawRoom(
      plan,
      getRectCells({ x: 5, y: 0 }, { x: 6, y: 1 }),
      seed('kitchen'),
    );

    const withWindow = placeOpening(
      plan,
      0,
      { x: 0.05, y: 1.5 },
      { type: 'WINDOW' },
    );

    applyPlanChanges(alice, plan, withKitchen, LOCAL);
    applyPlanChanges(bob, plan, withWindow, LOCAL);
    exchange(alice, bob);

    const merged = readPlanFromDoc(alice);

    expect(merged).toEqual(readPlanFromDoc(bob));
    expect(merged.rooms.map((room) => room.id)).toEqual(['hall', 'kitchen']);
    expect(merged.windows).toHaveLength(1);
    expect(merged.doors).toHaveLength(1);
  });

  it('удалённая другим комната не возвращается чужой правкой', () => {
    const plan = drawRoom(
      createHallPlan(),
      getRectCells({ x: 5, y: 0 }, { x: 6, y: 1 }),
      seed('kitchen'),
    );

    const alice = createSeededDoc(plan, 1);
    const bob = createSeededDoc(plan, 1);

    applyPlanChanges(alice, plan, removeRoom(plan, 'kitchen'), LOCAL);

    applyPlanChanges(
      bob,
      plan,
      placeOpening(plan, 0, { x: 0.05, y: 1.5 }, { type: 'WINDOW' }),
      LOCAL,
    );

    exchange(alice, bob);

    expect(readPlanFromDoc(bob).rooms.map((room) => room.id)).toEqual(['hall']);
  });

  it('спорная клетка остаётся за комнатой, нарисованной раньше', () => {
    const plan = createHallPlan();
    const alice = createSeededDoc(plan, 1);
    const bob = createSeededDoc(plan, 1);
    const cells = getRectCells({ x: 5, y: 5 }, { x: 6, y: 6 });

    applyPlanChanges(
      alice,
      plan,
      drawRoom(plan, cells, seed('a')),
      LOCAL,
      () => 10,
    );

    applyPlanChanges(
      bob,
      plan,
      drawRoom(plan, cells, seed('b')),
      LOCAL,
      () => 20,
    );

    exchange(alice, bob);

    const merged = readPlanFromDoc(bob);

    expect(merged.rooms.map((room) => room.id)).toEqual(['hall', 'a']);
  });

  it('личная отмена откатывает только свои правки', () => {
    const plan = createHallPlan();
    const alice = createSeededDoc(plan, 1);
    const bob = createSeededDoc(plan, 1);

    const undo = new Y.UndoManager(
      [alice.getMap('rooms'), alice.getMap('windows')],
      { trackedOrigins: new Set([LOCAL]), captureTimeout: 0 },
    );

    applyPlanChanges(
      alice,
      plan,
      drawRoom(
        plan,
        getRectCells({ x: 5, y: 0 }, { x: 6, y: 1 }),
        seed('kitchen'),
      ),
      LOCAL,
    );

    applyPlanChanges(
      bob,
      plan,
      placeOpening(plan, 0, { x: 0.05, y: 1.5 }, { type: 'WINDOW' }),
      LOCAL,
    );

    exchange(alice, bob);
    undo.undo();

    const result = readPlanFromDoc(alice);

    expect(result.rooms.map((room) => room.id)).toEqual(['hall']);
    expect(result.windows).toHaveLength(1);
  });

  it('версия после сохранения видна всем', () => {
    const plan = createHallPlan();
    const alice = createSeededDoc(plan, 1);
    const bob = createSeededDoc(plan, 1);

    setPlanDocVersion(alice, 2, null);
    exchange(alice, bob);

    expect(getPlanDocVersion(bob)).toBe(2);
  });
});
