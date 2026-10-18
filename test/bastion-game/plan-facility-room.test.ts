import type { FacilityRoomTemplate, PlanDocument } from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  createDefaultRoomTemplate,
  createEmptyPlan,
  createTemplatePlan,
  drawRoom,
  getFacilityFurniture,
  getFacilityRoomSize,
  getFurnitureSize,
  getRectCells,
  getRoomSizeOptions,
  isPremiumFurniture,
  placeFacilityRoom,
  readTemplatePlan,
  resizeRoomTemplate,
} from '~bastion-game/model';
import { getRoomTemplateSpaces } from '~bastions/model';

const bedroom = {
  id: 'f-bedroom',
  name: 'Спальня',
  facilityUrl: 'bedroom',
  squares: 16,
  roomTemplate: undefined,
};

const template: FacilityRoomTemplate = {
  space: 'ROOMY',
  width: 8,
  depth: 2,
  furniture: [
    { kind: 'BED', x: 0, y: 0, rotation: 0 },
    { kind: 'FOUNTAIN', x: 2, y: 0, rotation: 0 },
    { kind: 'CHEST', x: 7, y: 1, rotation: 0 },
  ],
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

describe('шаблон готовой комнаты', () => {
  it('ставит комнату по шаблону, если он на эту площадь', () => {
    const plan = placeFacilityRoom(
      createEmptyPlan(),
      0,
      { x: 10, y: 10 },
      { ...bedroom, roomTemplate: template },
      true,
    );

    const cells = plan.rooms[0]?.cells ?? [];
    const left = Math.min(...cells.map((cell) => cell.x));
    const top = Math.min(...cells.map((cell) => cell.y));

    expect(Math.max(...cells.map((cell) => cell.x)) - left + 1).toBe(8);

    expect(
      plan.furniture.map(({ kind, x, y, rotation }) => ({
        kind,
        x: x - left,
        y: y - top,
        rotation,
      })),
    ).toEqual(template.furniture);
  });

  it('без подписки убирает из шаблона предметы по подписке', () => {
    const plan = placeFacilityRoom(
      createEmptyPlan(),
      0,
      { x: 10, y: 10 },
      { ...bedroom, roomTemplate: template },
      false,
    );

    expect(plan.furniture.map((item) => item.kind)).toEqual(['BED', 'CHEST']);
  });

  it('после расширения шаблон не на ту площадь, и мебель расставляется сама', () => {
    const plan = placeFacilityRoom(
      createEmptyPlan(),
      0,
      { x: 10, y: 10 },
      { ...bedroom, squares: 36, roomTemplate: template },
      false,
    );

    expect(plan.rooms[0]?.cells).toHaveLength(36);
    expect(plan.furniture.length).toBeGreaterThan(0);
  });

  it('по умолчанию берёт автоматическую расстановку', () => {
    const fallback = createDefaultRoomTemplate('bedroom', 'ROOMY', 16);

    expect(fallback).toMatchObject({ space: 'ROOMY', width: 4, depth: 4 });
    expect(fallback.furniture.map((item) => item.kind)).toContain('BED');
  });

  it('план редактора возвращает тот же шаблон', () => {
    expect(
      readTemplatePlan(createTemplatePlan(template, ''), template),
    ).toEqual(template);
  });

  it('мебель за стенами в шаблон не попадает', () => {
    const plan = createTemplatePlan(template, '');

    const moved = {
      ...plan,
      furniture: plan.furniture.map((item) =>
        item.kind === 'CHEST' ? { ...item, x: item.x + 1 } : item,
      ),
    };

    expect(
      readTemplatePlan(moved, template).furniture.map((item) => item.kind),
    ).toEqual(['BED', 'FOUNTAIN']);
  });

  it('при смене размера убирает то, что не помещается', () => {
    const resized = resizeRoomTemplate(template, 4, 4);

    expect(resized).toMatchObject({ width: 4, depth: 4 });

    expect(resized.furniture.map((item) => item.kind)).toEqual([
      'BED',
      'FOUNTAIN',
    ]);
  });

  it('предлагает все прямоугольники на площадь', () => {
    expect(getRoomSizeOptions(4)).toEqual([
      { width: 1, depth: 4 },
      { width: 2, depth: 2 },
      { width: 4, depth: 1 },
    ]);
  });

  it('шаблоны настраиваются для своих пространств и расширения', () => {
    expect(
      getRoomTemplateSpaces({
        category: 'BASIC',
        space: undefined,
        enlargement: null,
      }),
    ).toEqual(['CRAMPED', 'ROOMY']);

    expect(
      getRoomTemplateSpaces({
        category: 'SPECIAL',
        space: 'ROOMY',
        enlargement: {
          space: 'VAST',
          cost: null,
          days: null,
          additionalHirelings: null,
          description: '',
        },
      }),
    ).toEqual(['ROOMY', 'VAST']);
  });
});
