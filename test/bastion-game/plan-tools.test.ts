import type { PlanDocument, PlanRoomSeed } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import {
  addColumn,
  addLevel,
  addTower,
  clearArea,
  createEmptyPlan,
  drawRoom,
  eraseCells,
  eraseObjectAt,
  getFurnitureSize,
  getRectCells,
  getTowerStairFrame,
  moveFurniture,
  moveRoom,
  paintDefenseGates,
  paintDefenseWall,
  placeFurniture,
  placeOpening,
  placeTowerStair,
} from '~bastion-game/model';
import {
  applyPlanChanges,
  readPlanFromDoc,
} from '~bastion-game/model/plan-sync';

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
 * Зал 6×4 в углу (0, 0) с дверью на северной стене.
 *
 * @returns План.
 */
function createHallPlan(): PlanDocument {
  const withHall = drawRoom(
    createEmptyPlan(),
    getRectCells({ x: 0, y: 0 }, { x: 5, y: 3 }),
    seed('hall'),
  );

  return placeOpening(
    withHall,
    0,
    { x: 4.5, y: 0 },
    { type: 'DOOR', kind: 'DOOR' },
  );
}

describe('мебель на плане', () => {
  it('ставится в клетку под указателем, повторный щелчок поворачивает', () => {
    const placed = placeFurniture(
      createHallPlan(),
      0,
      { x: 1.4, y: 1.6 },
      'BED',
    );

    expect(placed.furniture).toHaveLength(1);
    expect(placed.furniture[0]).toMatchObject({ x: 1, y: 1, rotation: 0 });

    const turned = placeFurniture(placed, 0, { x: 1.5, y: 2.5 }, 'TABLE');

    expect(turned.furniture).toHaveLength(1);
    expect(turned.furniture[0]).toMatchObject({ kind: 'BED', rotation: 90 });

    expect(getFurnitureSize(turned.furniture[0]!)).toEqual({
      width: 2,
      depth: 1,
    });
  });

  it('не выходит за край участка', () => {
    const plan = createHallPlan();

    expect(placeFurniture(plan, 0, { x: 199.5, y: 5 }, 'SOFA')).toBe(plan);
  });

  it('стирается ластиком и едет вместе с комнатой', () => {
    const plan = placeFurniture(
      createHallPlan(),
      0,
      { x: 2.5, y: 2.5 },
      'CHAIR',
    );

    expect(eraseObjectAt(plan, 0, { x: 2.5, y: 2.5 }).furniture).toEqual([]);

    const moved = moveRoom(plan, 'hall', { x: 3, y: 1 });

    expect(moved.furniture[0]).toMatchObject({ x: 5, y: 3 });
  });

  it('сливается в общем документе', () => {
    const doc = new Y.Doc();
    const empty = createEmptyPlan();
    const plan = placeFurniture(empty, 0, { x: 3, y: 3 }, 'WARDROBE');

    applyPlanChanges(doc, empty, plan, 'local');

    expect(readPlanFromDoc(doc).furniture).toEqual(plan.furniture);
  });
});

describe('выделенный участок', () => {
  it('обрезает комнату и убирает предметы внутри рамки', () => {
    const withColumn = addColumn(createHallPlan(), {
      id: 'column',
      level: 0,
      x: 1,
      y: 1,
    });

    const plan = placeFurniture(withColumn, 0, { x: 0.5, y: 2.5 }, 'TABLE');

    const cleared = clearArea(plan, 0, {
      from: { x: 0, y: 0 },
      to: { x: 2, y: 3 },
    });

    expect(cleared.rooms[0]?.cells).toHaveLength(12);
    expect(cleared.columns).toEqual([]);
    expect(cleared.furniture).toEqual([]);
    // Дверь стоит над клеткой (4, 0) — вне рамки — и остаётся.
    expect(cleared.doors).toHaveLength(1);
  });

  it('целиком убирает то, что лежит на участке', () => {
    const cleared = clearArea(createHallPlan(), 0, {
      from: { x: 6, y: 4 },
      to: { x: -1, y: -1 },
    });

    expect(cleared.rooms).toEqual([]);
    expect(cleared.doors).toEqual([]);
  });

  it('пустой участок план не меняет', () => {
    const plan = createHallPlan();

    expect(
      clearArea(plan, 0, { from: { x: 20, y: 20 }, to: { x: 25, y: 25 } }),
    ).toBe(plan);
  });
});

describe('винтовая лестница в башне', () => {
  /**
   * План с башней радиусом 3 и этажом выше.
   *
   * @param cx Центр башни по x.
   * @returns План.
   */
  function createTowerPlan(cx: number): PlanDocument {
    return addTower(addLevel(createEmptyPlan(), 'up').document, seed('tower'), {
      cx,
      cy: 10,
      r: 3,
    });
  }

  it('встаёт по центру башни с проходом у стены', () => {
    expect(
      getTowerStairFrame(createTowerPlan(10), 0, { x: 10, y: 10 }),
    ).toEqual({ x: 8, y: 8, width: 4, height: 4 });

    expect(
      getTowerStairFrame(createTowerPlan(10.5), 0, { x: 10, y: 10 }),
    ).toEqual({ x: 8, y: 8, width: 5, height: 4 });
  });

  it('вне башни рамки нет', () => {
    expect(
      getTowerStairFrame(createTowerPlan(10), 0, { x: 30, y: 30 }),
    ).toBeUndefined();
  });

  it('ставится винтовой и не дублируется', () => {
    const stairSeed = { id: 'spiral', toLevel: 1, direction: 'N' as const };

    const plan = placeTowerStair(
      createTowerPlan(10),
      0,
      { x: 9, y: 9 },
      stairSeed,
    );

    expect(plan.stairs).toEqual([
      {
        ...stairSeed,
        level: 0,
        x: 8,
        y: 8,
        width: 4,
        height: 4,
        kind: 'SPIRAL',
      },
    ]);

    expect(
      placeTowerStair(plan, 0, { x: 11, y: 11 }, { ...stairSeed, id: 'again' }),
    ).toBe(plan);
  });
});

describe('ворота в защитной стене', () => {
  const line = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  it('встают только в построенную стену', () => {
    const walled = paintDefenseWall(createEmptyPlan(), line.slice(0, 2));

    const gated = paintDefenseGates(
      walled,
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      true,
    );

    expect(gated.defenseWalls).toHaveLength(2);
    expect(gated.defenseGates).toEqual([{ x: 1, y: 0 }]);
  });

  it('закладываются стеной и пропадают вместе со стеной', () => {
    const walled = paintDefenseWall(createEmptyPlan(), line);
    const gated = paintDefenseGates(walled, line, true);
    const closed = paintDefenseGates(gated, [{ x: 0, y: 0 }], false);

    expect(closed.defenseGates).toHaveLength(2);
    expect(closed.defenseWalls).toHaveLength(3);

    expect(eraseCells(closed, 0, [{ x: 1, y: 0 }]).defenseGates).toEqual([
      { x: 2, y: 0 },
    ]);
  });

  it('переживают синхронизацию', () => {
    const doc = new Y.Doc();

    const plan = paintDefenseGates(
      paintDefenseWall(createEmptyPlan(), line),
      line,
      true,
    );

    applyPlanChanges(doc, createEmptyPlan(), plan, 'local');

    expect(readPlanFromDoc(doc).defenseGates).toHaveLength(3);
  });
});

describe('поворот мебели до установки', () => {
  it('новый предмет встаёт с выбранным поворотом', () => {
    const plan = placeFurniture(
      createEmptyPlan(),
      0,
      { x: 3, y: 3 },
      'BED',
      90,
    );

    expect(plan.furniture[0]).toMatchObject({ kind: 'BED', rotation: 90 });

    expect(getFurnitureSize(plan.furniture[0]!)).toEqual({
      width: 2,
      depth: 1,
    });
  });
});

describe('перетаскивание мебели', () => {
  it('сдвигает предмет и не выносит его за участок', () => {
    const plan = placeFurniture(createEmptyPlan(), 0, { x: 3, y: 3 }, 'TABLE');
    const id = plan.furniture[0]!.id;

    expect(moveFurniture(plan, id, { x: 2, y: -1 }).furniture[0]).toMatchObject(
      {
        x: 5,
        y: 2,
      },
    );

    expect(moveFurniture(plan, id, { x: -10, y: 0 })).toBe(plan);
    expect(moveFurniture(plan, id, { x: 0, y: 0 })).toBe(plan);
  });
});
