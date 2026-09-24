import type {
  CatalogFacility,
  FacilitySetupDraft,
  PlayerBastionFacility,
  PlayerBastionMember,
} from '~bastion-game/model';

import { describe, expect, it } from 'vitest';

import {
  canAddSpecial,
  createSetupDraft,
  getAvailableSpecialFacilities,
  getBasicFacilities,
  toSetupRequest,
} from '~bastion-game/model';

/**
 * Сооружение справочника для экрана выбора.
 *
 * @param url адрес сооружения.
 * @param overrides отличающиеся поля.
 * @returns сооружение справочника.
 */
function catalogFacility(
  url: string,
  overrides: Partial<CatalogFacility> = {},
): CatalogFacility {
  return {
    url,
    name: { rus: url, eng: url },
    category: { value: 'SPECIAL', name: 'специализированное сооружение' },
    level: 5,
    repeatable: false,
    ...overrides,
  };
}

/**
 * Сооружение персонажа.
 *
 * @param url адрес сооружения.
 * @param category вид сооружения.
 * @param space пространство.
 * @returns сооружение персонажа.
 */
function ownedFacility(
  url: string,
  category: 'BASIC' | 'SPECIAL',
  space: 'CRAMPED' | 'ROOMY',
): PlayerBastionFacility {
  return {
    id: `id-${url}`,
    facilityUrl: url,
    name: url,
    category: { value: category, name: category },
    space: { value: space, name: space, squares: 4 },
    orders: [],
    prerequisiteConfirmed: true,
    choices:
      url === 'garden' ? [{ name: 'Тип сада', options: ['Травяной'] }] : [],
  };
}

describe('черновик стартового выбора', () => {
  it('собирается из сооружений персонажа: базовые по пространству, остальные — списком', () => {
    const member: PlayerBastionMember = {
      id: 'member',
      userId: 'player',
      characterName: 'Дриззт',
      characterLevel: 5,
      specialFacilityLimit: 2,
      canEditFacilities: true,
      basicComplete: false,
      facilities: [
        ownedFacility('bedroom', 'BASIC', 'CRAMPED'),
        ownedFacility('garden', 'SPECIAL', 'ROOMY'),
      ],
    };

    expect(createSetupDraft(member)).toEqual({
      basic: { CRAMPED: 'bedroom', ROOMY: undefined },
      special: [
        { facilityUrl: 'garden', choices: { 'Тип сада': ['Травяной'] } },
      ],
    });
  });

  it('в запрос не уходят пустые слоты и пустые выборы', () => {
    const draft: FacilitySetupDraft = {
      basic: { CRAMPED: undefined, ROOMY: 'kitchen' },
      special: [
        {
          facilityUrl: 'garden',
          choices: { 'Тип сада': [], 'Лишний': [] },
        },
      ],
    };

    expect(toSetupRequest(draft, 3)).toEqual({
      basic: [{ facilityUrl: 'kitchen', space: 'ROOMY' }],
      special: [{ facilityUrl: 'garden', choices: [] }],
      version: 3,
    });
  });
});

describe('доступные сооружения', () => {
  const catalog = [
    catalogFacility('smithy'),
    catalogFacility('gaming-hall', { level: 9 }),
    catalogFacility('armory'),
    catalogFacility('kitchen', {
      category: { value: 'BASIC', name: 'базовое сооружение' },
      level: null,
    }),
  ];

  it('специализированные — не выше уровня персонажа, по уровню и алфавиту', () => {
    expect(
      getAvailableSpecialFacilities(catalog, 5).map((facility) => facility.url),
    ).toEqual(['armory', 'smithy']);

    expect(
      getAvailableSpecialFacilities(catalog, 9).map((facility) => facility.url),
    ).toEqual(['armory', 'smithy', 'gaming-hall']);
  });

  it('базовые — отдельным списком', () => {
    expect(getBasicFacilities(catalog).map((facility) => facility.url)).toEqual(
      ['kitchen'],
    );
  });
});

describe('добавление специализированного сооружения', () => {
  const draft: FacilitySetupDraft = {
    basic: { CRAMPED: undefined, ROOMY: undefined },
    special: [{ facilityUrl: 'smithy', choices: {} }],
  };

  it('каждое — один раз, если не «можно несколько»', () => {
    expect(canAddSpecial(draft, catalogFacility('smithy'), 2)).toBe(false);

    expect(
      canAddSpecial(draft, catalogFacility('smithy', { repeatable: true }), 2),
    ).toBe(true);
  });

  it('не больше лимита по уровню', () => {
    expect(canAddSpecial(draft, catalogFacility('armory'), 1)).toBe(false);
    expect(canAddSpecial(draft, catalogFacility('armory'), 2)).toBe(true);
  });
});
