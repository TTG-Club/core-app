import type { PlanDocument, PlanOutline } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  addBuilding,
  addFloor,
  eraseAt,
  getCellsInside,
  getFacilityAreas,
  getNearestEdge,
  getPlanLevels,
  moveBuilding,
  paintFacilityCell,
  parsePlanResponse,
  removeFloor,
  toggleDoor,
  toggleStair,
} from '~bastion-game/model';

const TOWER: PlanOutline = { type: 'CIRCLE', cx: 5, cy: 6, r: 2 };

/**
 * План с одной круглой башней радиусом 10 футов.
 *
 * @param level Текущий уровень редактора при создании.
 * @returns План.
 */
function createTowerPlan(level = 0): PlanDocument {
  return addBuilding(
    { buildings: [], passages: [], walls: [] },
    { id: 'tower', name: 'Башня 1', kind: 'TOWER', outline: TOWER },
    level,
  );
}

describe('геометрия плана', () => {
  it('круглая башня радиусом 2 клетки — 12 клеток, как на сервере', () => {
    const cells = getCellsInside(TOWER);

    expect(cells).toHaveLength(12);
    expect(cells).toContainEqual({ x: 4, y: 5 });
    expect(cells).not.toContainEqual({ x: 3, y: 4 });
  });

  it('дверь встаёт на ближайшее ребро клетки', () => {
    expect(getNearestEdge(4.5, 5.1)).toEqual({ x: 4, y: 5, side: 'N' });
    expect(getNearestEdge(4.95, 5.5)).toEqual({ x: 4, y: 5, side: 'E' });
  });
});

describe('правка плана', () => {
  it('корпус на втором этаже получает этажи с первого по текущий', () => {
    const plan = createTowerPlan(1);

    expect(plan.buildings[0]?.floors.map((floor) => floor.level)).toEqual([
      0, 1,
    ]);

    expect(getPlanLevels(plan)).toEqual([0, 1]);
  });

  it('кисть красит только внутри корпуса и не больше площади пространства', () => {
    const facility = { id: 'bedroom', squares: 4 };

    let plan = createTowerPlan();

    plan = paintFacilityCell(plan, 0, { x: 0, y: 0 }, facility);
    expect(getFacilityAreas(plan).get('bedroom')).toBeUndefined();

    for (const cell of getCellsInside(TOWER).slice(0, 6)) {
      plan = paintFacilityCell(plan, 0, cell, facility);
    }

    expect(getFacilityAreas(plan).get('bedroom')).toBe(4);
  });

  it('сооружение можно разложить по этажам — площадь считается суммой', () => {
    const facility = { id: 'library', squares: 16 };

    let plan = addFloor(createTowerPlan(), 'tower', 'up');

    for (const cell of getCellsInside(TOWER)) {
      plan = paintFacilityCell(plan, 0, cell, facility);
    }

    for (const cell of getCellsInside(TOWER)) {
      plan = paintFacilityCell(plan, 1, cell, facility);
    }

    expect(getFacilityAreas(plan).get('library')).toBe(16);
  });

  it('перемещение корпуса сдвигает его клетки и двери', () => {
    let plan = paintFacilityCell(
      createTowerPlan(),
      0,
      { x: 4, y: 5 },
      { id: 'bedroom', squares: 4 },
    );

    plan = toggleDoor(plan, 0, { x: 4, y: 5, side: 'N' }, 'DOOR');
    plan = moveBuilding(plan, 'tower', 2, -1);

    const building = plan.buildings[0]!;

    expect(building.outline).toEqual({ type: 'CIRCLE', cx: 7, cy: 5, r: 2 });

    expect(building.floors[0]?.cells).toEqual([
      { x: 6, y: 4, facilityId: 'bedroom' },
    ]);

    expect(building.floors[0]?.doors).toEqual([
      { x: 6, y: 4, side: 'N', kind: 'DOOR' },
    ]);
  });

  it('повторная дверь того же вида убирается, другого — заменяет', () => {
    const edge = { x: 4, y: 5, side: 'N' as const };
    const withDoor = toggleDoor(createTowerPlan(), 0, edge, 'DOOR');

    expect(
      toggleDoor(withDoor, 0, edge, 'SECRET').buildings[0]?.floors[0]?.doors,
    ).toEqual([{ ...edge, kind: 'SECRET' }]);

    expect(
      toggleDoor(withDoor, 0, edge, 'DOOR').buildings[0]?.floors[0]?.doors,
    ).toEqual([]);
  });

  it('лестница ведёт наверх, а удаление этажа убирает лестницы на него', () => {
    let plan = addFloor(createTowerPlan(), 'tower', 'up');

    plan = toggleStair(plan, 0, { x: 4, y: 5 });

    expect(plan.buildings[0]?.floors[0]?.stairs).toEqual([
      { x: 4, y: 5, toLevel: 1 },
    ]);

    plan = removeFloor(plan, 'tower', 1);
    expect(plan.buildings[0]?.floors).toHaveLength(1);
    expect(plan.buildings[0]?.floors[0]?.stairs).toEqual([]);
  });

  it('ластик стирает сооружение в клетке', () => {
    const painted = paintFacilityCell(
      createTowerPlan(),
      0,
      { x: 4, y: 5 },
      { id: 'bedroom', squares: 4 },
    );

    expect(getFacilityAreas(eraseAt(painted, 0, { x: 4, y: 5 })).size).toBe(0);
  });
});

describe('ответ сервера', () => {
  it('null превращается в пустые списки, неполный контур отбрасывается', () => {
    const state = parsePlanResponse({
      bastionId: 'bastion',
      version: 3,
      canEdit: true,
      document: {
        buildings: [
          {
            id: 'tower',
            name: 'Башня',
            kind: 'TOWER',
            outline: { type: 'CIRCLE', cx: 5, cy: 6, r: 2 },
            floors: [
              {
                level: 0,
                cells: null,
                doors: null,
                windows: null,
                stairs: null,
              },
            ],
          },
          {
            id: 'broken',
            outline: { type: 'RECTANGLE', x: 1, y: null },
            floors: null,
          },
        ],
        passages: null,
        walls: null,
      },
    });

    expect(state.version).toBe(3);

    expect(state.document.buildings.map((building) => building.id)).toEqual([
      'tower',
    ]);

    expect(state.document.buildings[0]?.floors[0]?.cells).toEqual([]);
    expect(state.document.walls).toEqual([]);
  });
});
