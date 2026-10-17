import type { PlanDocument, PlanRoomSeed } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  addColumn,
  addTower,
  canMoveObjects,
  createEmptyPlan,
  drawRoom,
  findObjectAt,
  getLevelCenter,
  getObjectsInArea,
  getRectCells,
  mergeRooms,
  moveObjects,
  placeFurniture,
  placeOpening,
  pruneSelection,
  removeObjects,
  toggleObject,
} from '~bastion-game/model';

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
 * Две соседние комнаты 3×3: «west» в (0, 0) и «east» в (3, 0), дверь между
 * ними и стул в западной.
 *
 * @returns План.
 */
function createTwoRoomsPlan(): PlanDocument {
  const withWest = drawRoom(
    createEmptyPlan(),
    getRectCells({ x: 0, y: 0 }, { x: 2, y: 2 }),
    seed('west'),
  );

  const withEast = drawRoom(
    withWest,
    getRectCells({ x: 3, y: 0 }, { x: 5, y: 2 }),
    seed('east'),
  );

  const withDoor = placeOpening(
    withEast,
    0,
    { x: 3, y: 1.5 },
    { type: 'DOOR', kind: 'DOOR' },
  );

  return placeFurniture(withDoor, 0, { x: 1.5, y: 1.5 }, 'CHAIR');
}

describe('выбор объектов плана', () => {
  it('находит под точкой сначала мелкое, потом комнату', () => {
    const plan = createTwoRoomsPlan();
    const [chair] = plan.furniture;

    expect(findObjectAt(plan, 0, { x: 1.5, y: 1.5 })).toEqual({
      kind: 'furniture',
      id: chair?.id,
    });

    expect(findObjectAt(plan, 0, { x: 4.5, y: 1.5 })).toEqual({
      kind: 'room',
      id: 'east',
    });

    expect(findObjectAt(plan, 0, { x: 10.5, y: 10.5 })).toBeUndefined();
  });

  it('shift+щелчок добавляет и убирает объект', () => {
    const west = { kind: 'room', id: 'west' } as const;
    const east = { kind: 'room', id: 'east' } as const;
    const both = toggleObject([west], east);

    expect(both).toEqual([west, east]);
    expect(toggleObject(both, west)).toEqual([east]);
  });

  it('рамка выбирает то, что целиком внутри', () => {
    const plan = createTwoRoomsPlan();

    const inside = getObjectsInArea(plan, 0, {
      from: { x: 0, y: 0 },
      to: { x: 3, y: 2 },
    });

    expect(inside).toContainEqual({ kind: 'room', id: 'west' });
    expect(inside).not.toContainEqual({ kind: 'room', id: 'east' });
    expect(inside.filter((item) => item.kind === 'furniture')).toHaveLength(1);
  });

  it('снимает исчезнувшие объекты и объекты другого этажа', () => {
    const plan = createTwoRoomsPlan();
    const selection = [{ kind: 'room', id: 'west' } as const];

    expect(pruneSelection(plan, selection, 0)).toBe(selection);
    expect(pruneSelection(plan, selection, 1)).toEqual([]);

    expect(
      pruneSelection(removeObjects(plan, selection), selection, 0),
    ).toEqual([]);
  });
});

describe('групповое перетаскивание', () => {
  it('двигает выбранные комнаты вместе с дверью и мебелью', () => {
    const plan = createTwoRoomsPlan();

    const moved = moveObjects(
      plan,
      [
        { kind: 'room', id: 'west' },
        { kind: 'room', id: 'east' },
      ],
      { x: 2, y: 3 },
    );

    expect(
      moved.rooms.find((room) => room.id === 'west')?.cells,
    ).toContainEqual({ x: 2, y: 3 });

    expect(moved.doors[0]).toMatchObject({ x: plan.doors[0]!.x + 2 });
    expect(moved.furniture[0]).toMatchObject({ x: 3, y: 4 });
  });

  it('сдвигает предмет один раз, даже если выбран и он, и его комната', () => {
    const plan = createTwoRoomsPlan();
    const [chair] = plan.furniture;

    const moved = moveObjects(
      plan,
      [
        { kind: 'room', id: 'west' },
        { kind: 'furniture', id: chair!.id },
      ],
      { x: 0, y: 4 },
    );

    expect(moved.furniture[0]).toMatchObject({ x: 1, y: 5 });
  });

  it('не наезжает на невыбранную комнату', () => {
    const plan = createTwoRoomsPlan();
    const selection = [{ kind: 'room', id: 'west' } as const];

    expect(canMoveObjects(plan, selection, { x: 1, y: 0 })).toBe(false);
    expect(moveObjects(plan, selection, { x: 1, y: 0 })).toBe(plan);
  });

  it('двигает колонну отдельно от комнаты', () => {
    const plan = addColumn(createTwoRoomsPlan(), {
      id: 'pillar',
      level: 0,
      x: 4.5,
      y: 1.5,
    });

    const moved = moveObjects(plan, [{ kind: 'column', id: 'pillar' }], {
      x: 0,
      y: 5,
    });

    expect(moved.columns[0]).toMatchObject({ x: 4.5, y: 6.5 });
    expect(moved.rooms).toEqual(plan.rooms);
  });
});

describe('удаление и объединение', () => {
  it('удаляет всё выбранное одним шагом', () => {
    const plan = createTwoRoomsPlan();
    const [chair] = plan.furniture;

    const next = removeObjects(plan, [
      { kind: 'room', id: 'east' },
      { kind: 'furniture', id: chair!.id },
    ]);

    expect(next.rooms.map((room) => room.id)).toEqual(['west']);
    expect(next.furniture).toEqual([]);
    expect(next.doors).toHaveLength(1);
  });

  it('объединяет комнаты в первую выбранную и убирает дверь между ними', () => {
    const plan = createTwoRoomsPlan();
    const merged = mergeRooms(plan, ['east', 'west']);

    expect(merged.rooms).toHaveLength(1);
    expect(merged.rooms[0]).toMatchObject({ id: 'east', name: 'east' });
    expect(merged.rooms[0]?.cells).toHaveLength(18);
    expect(merged.doors).toEqual([]);
    expect(merged.furniture).toEqual(plan.furniture);
  });

  it('не объединяет башни', () => {
    const plan = addTower(createTwoRoomsPlan(), seed('tower'), {
      cx: 10,
      cy: 10,
      r: 2,
    });

    expect(mergeRooms(plan, ['west', 'tower'])).toBe(plan);
  });
});

describe('центр плана', () => {
  it('учитывает комнаты и стоящие вне них предметы', () => {
    const plan = createTwoRoomsPlan();

    expect(getLevelCenter(plan, 0)).toEqual({ x: 3, y: 1.5 });

    const withColumn = addColumn(plan, { id: 'far', level: 0, x: 10, y: 1.5 });

    expect(getLevelCenter(withColumn, 0)).toEqual({ x: 5, y: 1.5 });
    expect(getLevelCenter(plan, 1)).toBeUndefined();
  });
});
