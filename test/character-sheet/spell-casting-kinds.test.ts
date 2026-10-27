import type { CharacterSpell, SpellTabFilter } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  getCustomSpellCastingKinds,
  getOrderedSpellCastingKinds,
  matchesSpellFilter,
  parseSpellCatalogMechanics,
} from '~character-sheet/model';

/** Отбор вкладки без сужения: каждый тест включает только свою часть. */
const EMPTY_SPELL_FILTER: SpellTabFilter = {
  preparedOnly: false,
  levels: [],
  castingKinds: [],
};

/** Заклинание книги первого круга: отбор по времени смотрит не на него. */
const BOOK_SPELL: CharacterSpell = {
  url: 'healing-word-phb',
  name: 'Лечащее слово',
  level: 1,
  school: 'Ограждение',
};

describe('getCustomSpellCastingKinds', () => {
  it('узнаёт бонусное действие раньше просто действия', () => {
    expect(getCustomSpellCastingKinds('1 бонусное действие')).toEqual([
      'bonus',
    ]);
  });

  it('узнаёт реакцию и действие', () => {
    expect(getCustomSpellCastingKinds('1 реакция')).toEqual(['reaction']);
    expect(getCustomSpellCastingKinds('1 Действие')).toEqual(['action']);
  });

  it('незнакомый текст читает как время дольше хода', () => {
    expect(getCustomSpellCastingKinds('10 минут')).toEqual(['long']);
  });

  it('пустое поле не даёт времени', () => {
    expect(getCustomSpellCastingKinds(undefined)).toEqual([]);
    expect(getCustomSpellCastingKinds('   ')).toEqual([]);
  });
});

describe('getOrderedSpellCastingKinds', () => {
  it('убирает повторы и ставит время в порядок строки', () => {
    expect(
      getOrderedSpellCastingKinds(['long', 'reaction', 'action', 'long']),
    ).toEqual(['action', 'reaction', 'long']);
  });
});

describe('parseSpellCatalogMechanics', () => {
  it('переводит единицы справочника во время накладывания', () => {
    const catalogMechanics = parseSpellCatalogMechanics({
      castingTime: [
        { value: null, unit: 'MINUTE', custom: null },
        { value: null, unit: 'BONUS', custom: '' },
      ],
    });

    expect(catalogMechanics.castingKinds).toEqual(['bonus', 'long']);
  });

  it('пропускает ритуал и вариант без единицы', () => {
    const catalogMechanics = parseSpellCatalogMechanics({
      castingTime: [
        { value: null, unit: 'ACTION', custom: '' },
        { value: null, unit: 'RITUAL', custom: null },
        { value: null, unit: null, custom: 'особое' },
      ],
    });

    expect(catalogMechanics.castingKinds).toEqual(['action']);
  });

  it('неожиданный ответ даёт пустые урон и время', () => {
    expect(parseSpellCatalogMechanics(null)).toEqual({
      damage: { base: [], cantripTiers: [] },
      castingKinds: [],
    });
  });
});

describe('matchesSpellFilter', () => {
  it('без отбора по времени оставляет заклинание с неизвестным временем', () => {
    expect(matchesSpellFilter(BOOK_SPELL, [], EMPTY_SPELL_FILTER)).toBe(true);
  });

  it('оставляет заклинание с любым из отобранных времён', () => {
    const castingFilter: SpellTabFilter = {
      ...EMPTY_SPELL_FILTER,
      castingKinds: ['bonus', 'reaction'],
    };

    expect(matchesSpellFilter(BOOK_SPELL, ['bonus'], castingFilter)).toBe(true);

    expect(matchesSpellFilter(BOOK_SPELL, ['action'], castingFilter)).toBe(
      false,
    );

    expect(matchesSpellFilter(BOOK_SPELL, [], castingFilter)).toBe(false);
  });
});
