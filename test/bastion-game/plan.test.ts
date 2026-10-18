import type { PlanDocument, PlanRoomSeed } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  addLevel,
  addTower,
  canRemoveLevel,
  createEmptyPlan,
  drawRoom,
  eraseCells,
  eraseObjectAt,
  getBoundaryKind,
  getBoundarySegments,
  getCircleCells,
  getEdgeKey,
  getFacilityAreas,
  getOccupancy,
  getRectCells,
  getStairTargetLevel,
  moveRoom,
  paintCorridor,
  paintDefenseWall,
  parsePlanResponse,
  placeOpening,
  removeLevel,
  updateRoom,
} from '~bastion-game/model';

/**
 * Заготовка комнаты первого этажа.
 *
 * @param id Идентификатор.
 * @param level Этаж.
 * @returns Заготовка.
 */
function seed(id: string, level = 0): PlanRoomSeed {
  return { id, name: id, level };
}

/**
 * План с залом 4×3 в углу (0, 0) и кухней 2×3 справа от него.
 *
 * @returns План.
 */
function createHallPlan(): PlanDocument {
  const withHall = drawRoom(
    createEmptyPlan(),
    getRectCells({ x: 0, y: 0 }, { x: 3, y: 2 }),
    seed('hall'),
  );

  return drawRoom(
    withHall,
    getRectCells({ x: 4, y: 0 }, { x: 5, y: 2 }),
    seed('kitchen'),
  );
}

describe('геометрия плана', () => {
  it('круглая башня радиусом 2 клетки — 12 клеток, как на сервере', () => {
    const cells = getCircleCells({ cx: 5, cy: 6, r: 2 });

    expect(cells).toHaveLength(12);
    expect(cells).toContainEqual({ x: 4, y: 5 });
    expect(cells).not.toContainEqual({ x: 3, y: 4 });
  });

  it('одно ребро записывается одинаково с обеих сторон', () => {
    expect(getEdgeKey({ level: 0, x: 3, y: 4, side: 'S' })).toBe(
      getEdgeKey({ level: 0, x: 3, y: 5, side: 'N' }),
    );

    expect(getEdgeKey({ level: 0, x: 3, y: 4, side: 'E' })).toBe(
      getEdgeKey({ level: 0, x: 4, y: 4, side: 'W' }),
    );
  });

  it('стены встают снаружи и между комнатами, внутри комнаты стены нет', () => {
    const occupancy = getOccupancy(createHallPlan(), 0);

    expect(
      getBoundaryKind(occupancy, { level: 0, x: 0, y: 0, side: 'N' }),
    ).toBe('wall');

    expect(
      getBoundaryKind(occupancy, { level: 0, x: 4, y: 1, side: 'W' }),
    ).toBe('wall');

    expect(
      getBoundaryKind(occupancy, { level: 0, x: 1, y: 1, side: 'W' }),
    ).toBeUndefined();
  });

  it('стена зала сливается в один отрезок', () => {
    const plan = drawRoom(
      createEmptyPlan(),
      getRectCells({ x: 0, y: 0 }, { x: 3, y: 2 }),
      seed('hall'),
    );

    const segments = getBoundarySegments(getOccupancy(plan, 0), 0, 'wall');

    expect(segments).toHaveLength(4);
    expect(segments).toContainEqual({ fromX: 0, fromY: 0, toX: 4, toY: 0 });
  });

  it('у двора вместо стены пунктирный край', () => {
    const plan = updateRoom(createHallPlan(), 'kitchen', { kind: 'COURTYARD' });
    const occupancy = getOccupancy(plan, 0);

    expect(
      getBoundaryKind(occupancy, { level: 0, x: 5, y: 0, side: 'N' }),
    ).toBe('edge');

    expect(
      getBoundaryKind(occupancy, { level: 0, x: 4, y: 1, side: 'W' }),
    ).toBe('wall');
  });
});

describe('комнаты', () => {
  it('новая комната забирает клетки у той, поверх которой нарисована', () => {
    const plan = drawRoom(
      createHallPlan(),
      getRectCells({ x: 3, y: 0 }, { x: 4, y: 0 }),
      seed('pantry'),
    );

    const areas = new Map(
      plan.rooms.map((room) => [room.id, room.cells.length]),
    );

    expect(areas.get('hall')).toBe(11);
    expect(areas.get('kitchen')).toBe(5);
    expect(areas.get('pantry')).toBe(2);
  });

  it('комната не забирает клетки башни', () => {
    const withTower = addTower(createEmptyPlan(), seed('tower'), {
      cx: 5,
      cy: 5,
      r: 2,
    });

    const plan = drawRoom(
      withTower,
      getRectCells({ x: 0, y: 0 }, { x: 9, y: 9 }),
      seed('hall'),
    );

    const tower = plan.rooms.find((room) => room.id === 'tower');
    const hall = plan.rooms.find((room) => room.id === 'hall');

    expect(tower?.cells).toHaveLength(12);
    expect(hall?.cells).toHaveLength(100 - 12);
  });

  it('коридор не перекрывает комнаты и сливается с задетым коридором', () => {
    const withCorridor = paintCorridor(
      createHallPlan(),
      getRectCells({ x: 0, y: 3 }, { x: 2, y: 3 }),
      seed('first'),
    );

    const plan = paintCorridor(
      withCorridor,
      getRectCells({ x: 2, y: 2 }, { x: 2, y: 5 }),
      seed('second'),
    );

    const corridors = plan.rooms.filter((room) => room.kind === 'CORRIDOR');

    expect(corridors).toHaveLength(1);
    expect(corridors[0]?.cells).toHaveLength(3 + 2);

    expect(plan.rooms.find((room) => room.id === 'hall')?.cells).toHaveLength(
      12,
    );
  });

  it('стёртая до конца комната исчезает вместе со своими дверями', () => {
    const withDoor = placeOpening(
      createHallPlan(),
      0,
      { x: 4, y: 1.5 },
      {
        type: 'DOOR',
        kind: 'DOOR',
      },
    );

    expect(withDoor.doors).toHaveLength(1);

    const plan = eraseCells(
      withDoor,
      0,
      getRectCells({ x: 4, y: 0 }, { x: 5, y: 2 }),
    );

    expect(plan.rooms.map((room) => room.id)).toEqual(['hall']);
    expect(plan.doors).toHaveLength(1);
  });

  it('сдвиг комнаты переносит её двери', () => {
    const base = drawRoom(
      createEmptyPlan(),
      getRectCells({ x: 0, y: 0 }, { x: 1, y: 1 }),
      seed('cell'),
    );

    const withDoor = placeOpening(
      base,
      0,
      { x: 0.5, y: 0 },
      { type: 'DOOR', kind: 'LOCKED' },
    );

    const plan = moveRoom(withDoor, 'cell', { x: 3, y: 2 });

    expect(plan.rooms[0]?.cells).toContainEqual({ x: 3, y: 2 });

    expect(plan.doors).toEqual([
      { level: 0, x: 3, y: 2, side: 'N', kind: 'LOCKED' },
    ]);
  });

  it('комнату нельзя сдвинуть на чужие клетки', () => {
    const plan = createHallPlan();

    expect(moveRoom(plan, 'kitchen', { x: -1, y: 0 })).toBe(plan);
  });

  it('площадь сооружения складывается по всем его комнатам', () => {
    const plan = updateRoom(
      updateRoom(createHallPlan(), 'hall', { facilityId: 'library' }),
      'kitchen',
      { facilityId: 'library' },
    );

    expect(getFacilityAreas(plan).get('library')).toBe(18);
  });
});

describe('двери, окна и проёмы башен', () => {
  it('дверь ставится только в стену, повторный щелчок меняет её вид', () => {
    const plan = createHallPlan();

    expect(
      placeOpening(plan, 0, { x: 1.5, y: 1.5 }, { type: 'DOOR', kind: 'DOOR' }),
    ).toBe(plan);

    const withDoor = placeOpening(
      plan,
      0,
      { x: 1.5, y: 0.05 },
      { type: 'DOOR', kind: 'DOOR' },
    );

    const changed = placeOpening(
      withDoor,
      0,
      { x: 1.5, y: 0.05 },
      { type: 'DOOR', kind: 'DOOR' },
    );

    expect(withDoor.doors[0]?.kind).toBe('DOOR');
    expect(changed.doors[0]?.kind).toBe('LOCKED');
  });

  it('окно заменяет дверь на том же месте', () => {
    const withDoor = placeOpening(
      createHallPlan(),
      0,
      { x: 1.5, y: 0 },
      {
        type: 'DOOR',
        kind: 'DOOR',
      },
    );

    const plan = placeOpening(
      withDoor,
      0,
      { x: 1.5, y: 0 },
      { type: 'WINDOW' },
    );

    expect(plan.doors).toHaveLength(0);
    expect(plan.windows).toEqual([{ level: 0, x: 1, y: 0, side: 'N' }]);
  });

  it('дверь в кольце башни встаёт под ближайшим углом с шагом 22.5°', () => {
    const tower = addTower(createEmptyPlan(), seed('tower'), {
      cx: 5,
      cy: 5,
      r: 2,
    });

    const plan = placeOpening(
      tower,
      0,
      { x: 7.3, y: 5.1 },
      { type: 'DOOR', kind: 'ARCH' },
    );

    expect(plan.towerOpenings).toEqual([
      { roomId: 'tower', angle: 0, type: 'DOOR', kind: 'ARCH' },
    ]);
  });

  it('ластик убирает дверь, а не пол под ней', () => {
    const withDoor = placeOpening(
      createHallPlan(),
      0,
      { x: 1.5, y: 0 },
      {
        type: 'DOOR',
        kind: 'DOOR',
      },
    );

    const plan = eraseObjectAt(withDoor, 0, { x: 1.5, y: 0.1 });

    expect(plan.doors).toHaveLength(0);
    expect(plan.rooms).toEqual(withDoor.rooms);
  });
});

describe('этажи и лестницы', () => {
  it('лестница по умолчанию ведёт на этаж выше, если он есть', () => {
    const { document } = addLevel(createEmptyPlan(), 'down');

    expect(getStairTargetLevel(document, 0, undefined)).toBe(-1);

    expect(
      getStairTargetLevel(addLevel(document, 'up').document, 0, undefined),
    ).toBe(1);

    expect(getStairTargetLevel(document, 0, 'up')).toBeUndefined();
  });

  it('убрать можно только пустой крайний этаж, лестницы на него исчезают', () => {
    const { document } = addLevel(createEmptyPlan(), 'up');

    const withStair: PlanDocument = {
      ...document,
      stairs: [
        {
          id: 'stair',
          level: 0,
          x: 0,
          y: 0,
          width: 1,
          height: 2,
          direction: 'N',
          toLevel: 1,
          kind: 'STRAIGHT',
        },
      ],
    };

    expect(canRemoveLevel(withStair, 0)).toBe(false);
    expect(canRemoveLevel(withStair, 1)).toBe(true);
    expect(removeLevel(withStair, 1).stairs).toHaveLength(0);
  });

  it('защитная стена не ложится на комнаты', () => {
    const plan = paintDefenseWall(
      createHallPlan(),
      getRectCells({ x: 0, y: 3 }, { x: 0, y: 0 }),
    );

    expect(plan.defenseWalls).toEqual([{ x: 0, y: 3 }]);
  });
});

describe('ответ сервера', () => {
  it('пустой план получает первый этаж и пустые списки', () => {
    const state = parsePlanResponse({
      bastionId: 'b',
      version: 0,
      canEdit: true,
      document: { levels: null, rooms: null },
    });

    expect(state.document).toEqual(createEmptyPlan());
  });

  it('у башни остаётся окружность, у комнаты — нет', () => {
    const state = parsePlanResponse({
      bastionId: 'b',
      version: 3,
      canEdit: false,
      document: {
        levels: [0, 1],
        rooms: [
          {
            id: 'tower',
            name: null,
            kind: 'TOWER',
            level: 0,
            facilityId: null,
            cells: [{ x: 1, y: 1 }],
            shape: { cx: 1.5, cy: 1.5, r: 1 },
          },
          {
            id: 'hall',
            name: 'Зал',
            kind: 'ROOM',
            level: 1,
            facilityId: 'f',
            cells: [{ x: 0, y: 0 }],
            shape: { cx: 1, cy: 1, r: 1 },
          },
        ],
      },
    });

    expect(state.document.rooms[0]).toMatchObject({
      name: 'Круглая башня',
      shape: { r: 1 },
    });

    expect(state.document.rooms[1]).toMatchObject({
      facilityId: 'f',
      shape: undefined,
    });
  });
});
