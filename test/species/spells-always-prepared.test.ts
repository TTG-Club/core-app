import { describe, expect, it } from 'vitest';

import {
  normalizeLoadedSpecies,
  readSpeciesSpellsAlwaysPrepared,
  writeSpeciesSpellsAlwaysPrepared,
} from '~species/model';

/** Ссылки на заклинания умения вида. */
const FEATURE_SPELLS = [
  { url: 'light', name: 'Свет' },
  { url: 'faerie-fire', name: 'Огонь фей', requiredLevel: 3 },
];

describe('«Подготавливать не нужно» у заклинаний умения вида', () => {
  it('снятая отметка переживает загрузку', () => {
    const loaded = normalizeLoadedSpecies({
      features: [
        {
          name: { rus: 'Магия дроу', eng: 'Drow Magic' },
          grantedSpells: FEATURE_SPELLS.map((spell) => ({
            ...spell,
            alwaysPrepared: false,
          })),
        },
      ],
    });

    expect(loaded.features).toMatchObject([
      {
        grantedSpells: [
          { url: 'light', alwaysPrepared: false },
          { url: 'faerie-fire', alwaysPrepared: false },
        ],
      },
    ]);
  });

  it('по умолчанию отметка стоит, снятая пишется false у всех', () => {
    expect(readSpeciesSpellsAlwaysPrepared(FEATURE_SPELLS)).toBe(true);

    const unprepared = writeSpeciesSpellsAlwaysPrepared(FEATURE_SPELLS, false);

    expect(unprepared.map((spell) => spell.alwaysPrepared)).toEqual([
      false,
      false,
    ]);

    expect(readSpeciesSpellsAlwaysPrepared(unprepared)).toBe(false);

    expect(
      writeSpeciesSpellsAlwaysPrepared(unprepared, true).map(
        (spell) => spell.alwaysPrepared,
      ),
    ).toEqual([undefined, undefined]);
  });

  it('строка без поля рядом со снятой отметкой отметку не возвращает', () => {
    expect(
      readSpeciesSpellsAlwaysPrepared([
        { url: 'light', alwaysPrepared: false },
        { url: 'darkness' },
      ]),
    ).toBe(false);
  });
});
