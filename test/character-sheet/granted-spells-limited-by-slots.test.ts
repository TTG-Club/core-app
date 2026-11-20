import type { Character } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  getKnownSpellNames,
  parseCharacter,
} from '~character-sheet/model';
import { CasterType } from '~classes/model';

/** Заклинание 3 круга черты «Адепт воплощения»: открывается по ячейкам. */
const FIREBALL = 'Огненный шар';

/** Заговор той же черты: ячейки не тратит и доступен всегда. */
const FIRE_BOLT = 'Огненный снаряд';

/** Заклинание 3 круга без условия «по ячейкам». */
const COUNTERSPELL = 'Контрзаклинание';

/** Класс персонажа для сборки листа. */
interface ClassSetup {
  url: string;
  level: number;
  casterType: CasterType;
}

/**
 * Собирает заклинание записи листа.
 *
 * @param name название заклинания.
 * @param level круг заклинания.
 * @param limitedBySlots открывается ли по ячейкам.
 * @returns заклинание в виде записи листа.
 */
function createSpell(
  name: string,
  level: number,
  limitedBySlots: boolean,
): Record<string, unknown> {
  return {
    url: name,
    name,
    level,
    prepared: true,
    alwaysPrepared: true,
    limitedBySlots,
  };
}

/**
 * Собирает персонажа с чертой «Адепт воплощения» и заданными классами.
 *
 * @param classes классы персонажа: первый — основной.
 * @returns персонаж, разобранный схемой листа.
 */
function createCharacter(classes: ClassSetup[]): Character {
  const [primary, ...additional] = classes.map((setup) => ({
    url: setup.url,
    name: setup.url,
    level: setup.level,
    casterType: setup.casterType,
  }));

  return parseCharacter(
    {
      ...structuredClone(DEFAULT_CHARACTER),
      level: classes.reduce((total, setup) => total + setup.level, 0),
      characterClass: primary,
      additionalClasses: additional,
      features: [
        {
          id: 'feat:evocation-adept',
          name: 'Адепт воплощения',
          origin: 'feat',
          spells: [
            createSpell(FIREBALL, 3, true),
            createSpell(FIRE_BOLT, 0, true),
            createSpell(COUNTERSPELL, 3, false),
          ],
        },
      ],
    },
    'sheet',
  );
}

describe('заклинания черты «по ячейкам»', () => {
  it('паладин 5 без ячеек 3 круга заклинание 3 круга не получает', () => {
    const names = getKnownSpellNames(
      createCharacter([
        { url: 'paladin', level: 5, casterType: CasterType.HALF },
      ]),
    );

    expect(names).not.toContain(FIREBALL);
    expect(names).toContain(FIRE_BOLT);
  });

  it('волшебник 5 получает', () => {
    expect(
      getKnownSpellNames(
        createCharacter([
          { url: 'wizard', level: 5, casterType: CasterType.FULL },
        ]),
      ),
    ).toContain(FIREBALL);
  });

  it('жрец 3 / волшебник 3 получает по общим ячейкам мультикласса', () => {
    expect(
      getKnownSpellNames(
        createCharacter([
          { url: 'cleric', level: 3, casterType: CasterType.FULL },
          { url: 'wizard', level: 3, casterType: CasterType.FULL },
        ]),
      ),
    ).toContain(FIREBALL);
  });

  it('колдун 5 получает по ячейкам договора', () => {
    expect(
      getKnownSpellNames(
        createCharacter([
          { url: 'warlock', level: 5, casterType: CasterType.PACT },
        ]),
      ),
    ).toContain(FIREBALL);
  });

  it('заклинание без отметки открыто без ячеек, как и раньше', () => {
    expect(
      getKnownSpellNames(
        createCharacter([
          { url: 'paladin', level: 5, casterType: CasterType.HALF },
        ]),
      ),
    ).toContain(COUNTERSPELL);
  });
});
