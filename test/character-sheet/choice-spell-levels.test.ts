import type { FeatSpellChoiceFilter } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  CANTRIP_SPELL_LEVEL,
  getChoiceSpellLevels,
} from '~character-sheet/model';

/** Наибольший круг пула «не выше круга» в тестах. */
const MAX_SPELL_LEVEL = 3;

/** Точный круг пула в тестах. */
const EXACT_SPELL_LEVEL = 2;

/**
 * Собирает фильтр пула заклинаний выбора.
 *
 * @param filterFields поля фильтра поверх пустой заготовки.
 * @returns фильтр пула.
 */
function createSpellFilter(
  filterFields: Partial<FeatSpellChoiceFilter>,
): FeatSpellChoiceFilter {
  return {
    level: null,
    maxLevel: null,
    classes: [],
    classesFromChoiceKey: '',
    ...filterFields,
  };
}

describe('круги пула заклинаний выбора', () => {
  it('«не выше круга» перечисляет круги с первого, без заговоров', () => {
    const spellLevels = getChoiceSpellLevels(
      createSpellFilter({ maxLevel: MAX_SPELL_LEVEL }),
    );

    expect(spellLevels).toEqual([1, 2, MAX_SPELL_LEVEL]);
    expect(spellLevels).not.toContain(CANTRIP_SPELL_LEVEL);
  });

  it('точный круг идёт одним значением', () => {
    expect(
      getChoiceSpellLevels(createSpellFilter({ level: EXACT_SPELL_LEVEL })),
    ).toEqual([EXACT_SPELL_LEVEL]);
  });

  it('выбор заговора спрашивает нулевой круг', () => {
    expect(
      getChoiceSpellLevels(createSpellFilter({ level: CANTRIP_SPELL_LEVEL })),
    ).toEqual([CANTRIP_SPELL_LEVEL]);
  });

  it('точный круг главнее верхней границы', () => {
    expect(
      getChoiceSpellLevels(
        createSpellFilter({
          level: EXACT_SPELL_LEVEL,
          maxLevel: MAX_SPELL_LEVEL,
        }),
      ),
    ).toEqual([EXACT_SPELL_LEVEL]);
  });

  it('без кругов в фильтре пул кругом не ограничен', () => {
    expect(getChoiceSpellLevels(createSpellFilter({}))).toEqual([]);
  });
});
