import type { ToolCatalogEntry } from '~character-sheet/model';

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
 * Собирает ответ справочника с владением инструментами ссылками.
 *
 * @param toolFields поля владения инструментами поверх заготовки.
 * @returns детальный ответ предыстории.
 */
function createBackgroundResponse(
  toolFields: Record<string, unknown>,
): Record<string, unknown> {
  return {
    url: 'criminal-phb',
    name: { rus: 'Преступник' },
    ...toolFields,
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
    );

    expect(background?.hasUnnamedTools).toBe(false);
  });

  it('не сообщает о потере, когда предыстория инструмент не даёт', () => {
    const background = parseBackgroundDetail(
      createBackgroundResponse({}),
      [],
      TOOL_ENTRIES,
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
    );

    expect(background?.toolChoice?.listed).toEqual([DICE_SET_NAME]);
  });
});
