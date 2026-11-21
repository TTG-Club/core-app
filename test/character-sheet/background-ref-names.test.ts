import type {
  FeatSelectOption,
  ToolCatalogEntry,
} from '~character-sheet/model';

import { describe, expect, it } from 'vitest';

import { parseBackgroundDetail } from '~character-sheet/model';

/** Адрес карточки инструмента в разделе «Предметы». */
const THIEVES_TOOLS_URL = 'thieves-tools-phb';

/** Название той же карточки в каталоге. */
const THIEVES_TOOLS_NAME = 'Воровские инструменты';

/** Название, сохранённое в самой ссылке предыстории. */
const SNAPSHOT_NAME = 'Отмычки';

/** Адрес игрового набора из пула выбора. */
const DICE_SET_URL = 'dice-set-phb';

/** Название игрового набора в каталоге. */
const DICE_SET_NAME = 'Игральные кости';

/** Каталог инструментов сайта в тестах. */
const TOOL_ENTRIES: ToolCatalogEntry[] = [
  { name: THIEVES_TOOLS_NAME, url: THIEVES_TOOLS_URL },
  { name: DICE_SET_NAME, url: DICE_SET_URL },
];

/**
 * Собирает ответ справочника со ссылками на инструменты или черты.
 *
 * @param extraFields поля ссылок поверх заготовки.
 * @returns детальный ответ предыстории.
 */
function createBackgroundResponse(
  extraFields: Record<string, unknown>,
): Record<string, unknown> {
  return {
    url: 'criminal-phb',
    name: { rus: 'Преступник' },
    ...extraFields,
  };
}

describe('названия инструментов предыстории', () => {
  it('подписывает ссылку без названия по каталогу', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        toolProficiencies: [{ url: THIEVES_TOOLS_URL }],
      }),
      [],
      TOOL_ENTRIES,
      [],
    );

    expect(background?.toolFixed).toEqual([
      { name: THIEVES_TOOLS_NAME, url: THIEVES_TOOLS_URL },
    ]);
  });

  it('оставляет название, сохранённое в ссылке', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        toolProficiencies: [{ url: THIEVES_TOOLS_URL, name: SNAPSHOT_NAME }],
      }),
      [],
      TOOL_ENTRIES,
      [],
    );

    expect(background?.toolFixed).toEqual([
      { name: SNAPSHOT_NAME, url: THIEVES_TOOLS_URL },
    ]);
  });

  it('пропускает ссылку, которой нет в каталоге', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        toolProficiencies: [{ url: THIEVES_TOOLS_URL }],
      }),
      [],
      [],
      [],
    );

    expect(background?.toolFixed).toEqual([]);
    expect(background?.hasUnnamedTools).toBe(true);
  });

  it('не считает потерянным инструмент, названный в тексте', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        toolProficiencies: [{ url: THIEVES_TOOLS_URL }],
        toolProficiency: [THIEVES_TOOLS_NAME],
      }),
      [],
      [],
      [],
    );

    expect(background?.hasUnnamedTools).toBe(false);
  });

  it('не сообщает о потере, когда предыстория инструмент не даёт', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({}),
      [],
      TOOL_ENTRIES,
      [],
    );

    expect(background?.hasUnnamedTools).toBe(false);
  });

  it('называет по каталогу варианты выбора инструмента', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        toolChoice: { count: 1, from: [{ url: DICE_SET_URL }] },
      }),
      [],
      TOOL_ENTRIES,
      [],
    );

    expect(background?.toolChoice?.listed).toEqual([DICE_SET_NAME]);
  });
});

/** Адрес черты из выбора предыстории. */
const GATHERED_WHISPERS_URL = 'gathered-whispers-rhw';

/** Название той же черты в каталоге черт. */
const GATHERED_WHISPERS_NAME = 'Собранный шёпот';

/** Адрес черты, которой нет в каталоге черт. */
const UNKNOWN_FEAT_URL = 'unknown-feat';

/** Каталог черт сайта в тестах. */
const FEAT_ENTRIES: FeatSelectOption[] = [
  {
    url: GATHERED_WHISPERS_URL,
    name: GATHERED_WHISPERS_NAME,
    category: '',
    sourceLabel: '',
    repeatability: false,
    abilities: [],
    abilityIncreaseCount: 0,
  },
];

describe('названия черт на выбор у предыстории', () => {
  it('подписывает вариант без названия по каталогу черт', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        featChoices: [{ url: GATHERED_WHISPERS_URL }],
      }),
      [],
      [],
      FEAT_ENTRIES,
    );

    expect(background?.featChoices).toEqual([
      { url: GATHERED_WHISPERS_URL, name: GATHERED_WHISPERS_NAME },
    ]);
  });

  it('оставляет вариант, которого нет в каталоге, с адресом вместо названия', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        featChoices: [{ url: GATHERED_WHISPERS_URL }],
      }),
      [],
      [],
      [],
    );

    expect(background?.featChoices).toEqual([
      { url: GATHERED_WHISPERS_URL, name: GATHERED_WHISPERS_URL },
    ]);
  });

  it('оставляет название, сохранённое в ссылке', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        featChoices: [{ url: GATHERED_WHISPERS_URL, name: SNAPSHOT_NAME }],
      }),
      [],
      [],
      FEAT_ENTRIES,
    );

    expect(background?.featChoices).toEqual([
      { url: GATHERED_WHISPERS_URL, name: SNAPSHOT_NAME },
    ]);
  });

  it('называет каждый вариант отдельно, не теряя порядок', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({
        featChoices: [
          { url: GATHERED_WHISPERS_URL },
          { url: UNKNOWN_FEAT_URL, name: SNAPSHOT_NAME },
          { url: UNKNOWN_FEAT_URL },
        ],
      }),
      [],
      [],
      FEAT_ENTRIES,
    );

    expect(background?.featChoices).toEqual([
      { url: GATHERED_WHISPERS_URL, name: GATHERED_WHISPERS_NAME },
      { url: UNKNOWN_FEAT_URL, name: SNAPSHOT_NAME },
      { url: UNKNOWN_FEAT_URL, name: UNKNOWN_FEAT_URL },
    ]);
  });
});
