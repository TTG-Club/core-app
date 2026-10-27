import type { PlanDocument, PlanFurniture } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  createEmptyPlan,
  drawRoom,
  findFurnitureAt,
  furnishRoom,
  getFacilityFurniture,
  getFacilityRoomSize,
  getFurnitureSize,
  getRectCells,
  isFloorFurniture,
  isPremiumFurniture,
  placeFacilityRoom,
  sortFurnitureByLayer,
} from '~bastion-game/model';

const bedroom = {
  id: 'f-bedroom',
  name: 'Спальня',
  facilityUrl: 'bedroom',
  squares: 16,
  furniture: [],
};

/**
 * Предсказуемый источник случайных чисел (mulberry32) для повторяемых тестов.
 *
 * @param seed Зерно.
 * @returns Функция, как Math.random.
 */
function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;

    let value = Math.imul(state ^ (state >>> 15), 1 | state);

    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Клетки, которые занимают предметы плана.
 *
 * @param plan План.
 * @returns Ключи «x:y» по одному на клетку, с повторами.
 */
function getFurnitureCells(
  plan: Pick<PlanDocument, 'furniture'>,
): Array<string> {
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
  });

  it('без подписки не ставит предметы по подписке', () => {
    expect(getFacilityFurniture('kitchen', [], false)).toEqual(
      getFacilityFurniture('kitchen', [], true).filter(
        (kind) => !isPremiumFurniture(kind),
      ),
    );

    expect(getFacilityFurniture('kitchen', [], true)).toContain('BARREL');

    expect(getFacilityFurniture('unknown-facility', [], false)).toEqual([
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

describe('случайная расстановка мебели', () => {
  it('без наложений в слое, в стенах и не больше 60% пола', () => {
    for (const side of [2, 4, 6]) {
      const room = { x: 3, y: 5, width: side, depth: side };

      const inside = new Set(
        getRectCells(room, { x: 3 + side - 1, y: 5 + side - 1 }).map(
          (cell) => `${cell.x}:${cell.y}`,
        ),
      );

      for (let seed = 1; seed <= 50; seed++) {
        const furniture = furnishRoom(
          room,
          0,
          ['BED', 'CHEST', 'WARDROBE', 'TABLE', 'CHAIR', 'RUG'],
          createRandom(seed),
        );

        const rugs = getFurnitureCells({
          furniture: furniture.filter((item) => isFloorFurniture(item.kind)),
        });

        const solid = getFurnitureCells({
          furniture: furniture.filter((item) => !isFloorFurniture(item.kind)),
        });

        const covered = new Set([...rugs, ...solid]);

        expect(new Set(rugs).size).toBe(rugs.length);
        expect(new Set(solid).size).toBe(solid.length);
        expect([...covered].every((cell) => inside.has(cell))).toBe(true);
        expect(covered.size).toBeLessThanOrEqual(side * side * 0.6);
      }
    }
  });

  it('ставит каждый предмет хотя бы раз, если он помещается', () => {
    const furniture = furnishRoom(
      { x: 0, y: 0, width: 6, depth: 6 },
      0,
      ['BED', 'CHEST', 'TABLE'],
      createRandom(7),
    );

    const kinds = new Set(furniture.map((item) => item.kind));

    expect(kinds).toEqual(new Set(['BED', 'CHEST', 'TABLE']));
  });

  it('с разным случаем расстановка разная', () => {
    const layouts = [1, 2, 3, 4].map((seed) =>
      JSON.stringify(
        furnishRoom(
          { x: 0, y: 0, width: 4, depth: 4 },
          0,
          ['BED', 'CHEST', 'CHAIR'],
          createRandom(seed),
        ).map(({ kind, x, y, rotation }) => [kind, x, y, rotation]),
      ),
    );

    expect(new Set(layouts).size).toBeGreaterThan(1);
  });

  it('берёт предметы из справочника сооружения', () => {
    const plan = placeFacilityRoom(
      createEmptyPlan(),
      0,
      { x: 10, y: 10 },
      { ...bedroom, furniture: ['BARREL', 'CHEST'] },
      true,
      createRandom(3),
    );

    expect(
      new Set(plan.furniture.map((item) => item.kind)).isSubsetOf(
        new Set(['BARREL', 'CHEST']),
      ),
    ).toBe(true);

    expect(getFacilityFurniture('bedroom', ['BARREL', 'CHEST'], false)).toEqual(
      ['CHEST'],
    );
  });

  it('мебель встаёт на ковёр', () => {
    const layouts = Array.from({ length: 20 }, (_, index) =>
      furnishRoom(
        { x: 0, y: 0, width: 4, depth: 4 },
        0,
        ['RUG', 'CHAIR', 'CHEST'],
        createRandom(index + 1),
      ),
    );

    const isOnRug = layouts.some((furniture) => {
      const rugs = new Set(
        getFurnitureCells({
          furniture: furniture.filter((item) => isFloorFurniture(item.kind)),
        }),
      );

      return getFurnitureCells({
        furniture: furniture.filter((item) => !isFloorFurniture(item.kind)),
      }).some((cell) => rugs.has(cell));
    });

    expect(isOnRug).toBe(true);

    expect(layouts.every((furniture) => furniture[0]?.kind === 'RUG')).toBe(
      true,
    );
  });
});

describe('ковёр под мебелью', () => {
  const rug: PlanFurniture = {
    id: 'rug',
    level: 0,
    x: 0,
    y: 0,
    kind: 'RUG',
    rotation: 0,
  };

  const chair: PlanFurniture = {
    id: 'chair',
    level: 0,
    x: 1,
    y: 0,
    kind: 'CHAIR',
    rotation: 0,
  };

  it('ковры рисуются первыми', () => {
    expect(sortFurnitureByLayer([chair, rug]).map((item) => item.id)).toEqual([
      'rug',
      'chair',
    ]);
  });

  it('щелчок по стулу на ковре попадает в стул', () => {
    const plan: PlanDocument = {
      ...createEmptyPlan(),
      furniture: [chair, rug],
    };

    expect(findFurnitureAt(plan, 0, { x: 1.5, y: 0.5 })?.id).toBe('chair');
    expect(findFurnitureAt(plan, 0, { x: 2.5, y: 1.5 })?.id).toBe('rug');
  });
});
