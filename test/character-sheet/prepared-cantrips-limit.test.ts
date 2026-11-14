import type { Character } from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHARACTER,
  getClassCantripNamesTakingSpace,
  getPreparedSpellsBreakdown,
  getPreparedSpellsLimitDescription,
  parseCharacter,
  PREPARED_LIMIT_PHRASES,
} from '~character-sheet/model';

/** Идентификатор листа в тестах. */
const SHEET_ID = 'sheet';

/** Предел заговоров колдуна 3 уровня по таблице класса. */
const CANTRIP_LIMIT = 2;

/** Заговоры, выбранные игроком при взятии класса. */
const CLASS_CANTRIP_NAMES = ['Волшебная рука', 'Горький ветер'];

/** Заговор умения с отметкой «Подготавливать не нужно». */
const TOME_CANTRIP_NAME = 'Злополучная стрела';

/** Заговор, который игрок держит в книге про запас. */
const BOOK_CANTRIP_NAME = 'Мистический заряд';

/**
 * Собирает заговор листа.
 *
 * @param name название заговора.
 * @param spellFields поля заговора поверх заготовки.
 * @returns заговор в виде записи листа.
 */
function createCantrip(
  name: string,
  spellFields: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    url: name,
    name,
    level: 0,
    prepared: false,
    ...spellFields,
  };
}

/**
 * Собирает колдуна 3 уровня: два заговора выбраны при взятии класса, один дан
 * воззванием сверх колонки, один лежит в книге.
 *
 * @returns персонаж, разобранный схемой листа.
 */
function createWarlock(): Character {
  return parseCharacter(
    {
      ...structuredClone(DEFAULT_CHARACTER),
      level: 3,
      characterClass: {
        url: 'warlock-phb',
        name: 'Колдун',
        level: 3,
        preparedCantrips: [{ level: 1, value: CANTRIP_LIMIT }],
      },
      spells: [createCantrip(BOOK_CANTRIP_NAME)],
      features: [
        {
          id: 'class:warlock-phb:pact-magic',
          name: 'Магия договора',
          origin: 'class',
          spells: CLASS_CANTRIP_NAMES.map((cantripName) =>
            createCantrip(cantripName, { alwaysPrepared: false }),
          ),
        },
        {
          id: 'class:warlock-phb:invocations',
          name: 'Таинственные воззвания',
          origin: 'class',
          spells: [
            createCantrip(TOME_CANTRIP_NAME, {
              prepared: true,
              alwaysPrepared: true,
            }),
          ],
        },
      ],
    },
    SHEET_ID,
  );
}

describe('заговоры класса, занимающие место', () => {
  it('считаются выбранные в мастере, без данных сверх колонки и без книги', () => {
    expect(getClassCantripNamesTakingSpace(createWarlock())).toEqual(
      CLASS_CANTRIP_NAMES,
    );
  });

  it('заполняют предел, хотя пометки подготовки у них нет', () => {
    const cantrips = getPreparedSpellsBreakdown(createWarlock(), 'cantrips');

    expect(cantrips.value).toBe(CANTRIP_LIMIT);
    expect(cantrips.count).toBe(CANTRIP_LIMIT);
  });
});

describe('предупреждение о пределе подготовленных', () => {
  it('места заняты заговорами класса — называет их и не советует снимать подготовку', () => {
    const description = getPreparedSpellsLimitDescription(
      CANTRIP_LIMIT,
      'cantrips',
      CLASS_CANTRIP_NAMES,
    );

    expect(description).toContain(PREPARED_LIMIT_PHRASES.allTakenByClass);

    expect(description).toContain(
      CLASS_CANTRIP_NAMES.join(PREPARED_LIMIT_PHRASES.namesSeparator),
    );

    expect(description).toContain(PREPARED_LIMIT_PHRASES.replaceHint);
    expect(description).not.toContain(PREPARED_LIMIT_PHRASES.unprepareRecord);

    expect(description).not.toContain(
      PREPARED_LIMIT_PHRASES.unprepareBookCantrip,
    );
  });

  it('часть мест занята заговорами класса — советует снять пометку в книге и называет их', () => {
    const [classCantripName = ''] = CLASS_CANTRIP_NAMES;

    const description = getPreparedSpellsLimitDescription(
      CANTRIP_LIMIT,
      'cantrips',
      [classCantripName],
    );

    expect(description).toContain(PREPARED_LIMIT_PHRASES.unprepareBookCantrip);
    expect(description).toContain(classCantripName);
    expect(description).toContain(PREPARED_LIMIT_PHRASES.alwaysPrepared);
  });

  it('заговоров класса нет — обычный совет', () => {
    const description = getPreparedSpellsLimitDescription(
      CANTRIP_LIMIT,
      'cantrips',
      [],
    );

    expect(description).toContain(PREPARED_LIMIT_PHRASES.unprepareRecord);
    expect(description).not.toContain(PREPARED_LIMIT_PHRASES.someTakenByClass);
  });

  it('у заклинаний кругов заговоры класса в текст не попадают', () => {
    const description = getPreparedSpellsLimitDescription(
      CANTRIP_LIMIT,
      'spells',
      CLASS_CANTRIP_NAMES,
    );

    expect(description).toContain(PREPARED_LIMIT_PHRASES.unprepareRecord);
    expect(description).not.toContain(PREPARED_LIMIT_PHRASES.allTakenByClass);
  });
});
