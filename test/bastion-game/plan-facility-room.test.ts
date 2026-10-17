import type { PlanDocument } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  createEmptyPlan,
  drawRoom,
  getFacilityFurniture,
  getFacilityRoomSize,
  getFurnitureSize,
  getRectCells,
  isPremiumFurniture,
  placeFacilityRoom,
} from '~bastion-game/model';

const bedroom = {
  id: 'f-bedroom',
  name: 'Спальня',
  facilityUrl: 'bedroom',
  squares: 16,
};

/**
 * Клетки, которые занимают предметы плана.
 *
 * @param plan План.
 * @returns Ключи «x:y» по одному на клетку, с повторами.
 */
function getFurnitureCells(plan: PlanDocument): Array<string> {
  return plan.furniture.flatMap((item) => {
    const { width, depth } = getFurnitureSize(item);

    return getRectCells(item, {
      x: item.x + width - 1,
      y: item.y + depth - 1,
    }).map((cell) => `${cell.x}:${cell.y}`);
  });
}

describe('готовая комната сооружения', () => {
  it('прямоугольник ближе к квадрату', () => {
    expect(getFacilityRoomSize(4)).toEqual({ width: 2, depth: 2 });
    expect(getFacilityRoomSize(16)).toEqual({ width: 4, depth: 4 });
    expect(getFacilityRoomSize(36)).toEqual({ width: 6, depth: 6 });
    expect(getFacilityRoomSize(12)).toEqual({ width: 4, depth: 3 });
  });

  it('ставит комнату сооружения с мебелью внутри', () => {
    const plan = placeFacilityRoom(
      createEmptyPlan(),
      0,
      { x: 10, y: 10 },
      bedroom,
      false,
    );

    const [room] = plan.rooms;

    expect(room).toMatchObject({ name: 'Спальня', facilityId: 'f-bedroom' });
    expect(room?.cells).toHaveLength(16);

    const roomCells = new Set(room?.cells.map((cell) => `${cell.x}:${cell.y}`));
    const furnitureCells = getFurnitureCells(plan);

    expect(plan.furniture.map((item) => item.kind)).toContain('BED');
    expect(furnitureCells.every((cell) => roomCells.has(cell))).toBe(true);
    expect(new Set(furnitureCells).size).toBe(furnitureCells.length);
  });

  it('без подписки не ставит предметы по подписке', () => {
    expect(getFacilityFurniture('kitchen', false)).toEqual(
      getFacilityFurniture('kitchen', true).filter(
        (kind) => !isPremiumFurniture(kind),
      ),
    );

    expect(getFacilityFurniture('kitchen', true)).toContain('BARREL');

    expect(getFacilityFurniture('unknown-facility', false)).toEqual([
      'TABLE',
      'CHAIR',
      'CHEST',
    ]);
  });

  it('не ставит комнату на занятое место', () => {
    const plan = drawRoom(
      createEmptyPlan(),
      getRectCells({ x: 0, y: 0 }, { x: 2, y: 2 }),
      { id: 'hall', name: 'Зал', level: 0 },
    );

    expect(placeFacilityRoom(plan, 0, { x: 3, y: 3 }, bedroom, false)).toBe(
      plan,
    );

    expect(placeFacilityRoom(plan, 0, { x: 8, y: 8 }, bedroom, false)).not.toBe(
      plan,
    );
  });
});
