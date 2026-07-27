import type {
  CatalogSpellDetail,
  Character,
  CharacterInventoryItem,
  CharacterSpell,
  FeatureDescriptionNode,
} from '../types';
import type { CatalogDescriptions } from './catalog';
import type { PdfBuildContext, PdfFlow } from './types';

import { FEATURE_ORIGIN_LABELS } from '../constants';
import {
  getAvailableInnateSpells,
  getInventoryGroups,
  getSpellGroups,
  getSpellLevelLabel,
  getSpellStatRows,
} from '../utils';
import {
  PDF_COLORS,
  PDF_CONTENT_WIDTH,
  PDF_FONT_SIZES,
  PDF_GAP,
  PDF_NOTE_SEPARATOR,
  PDF_PAGE_MARGIN,
  PDF_TITLES,
} from './constants';
import {
  createPdfFlow,
  drawSectionHeader,
  drawTextBlocks,
  drawTextLine,
} from './layout';
import { toPdfTextBlocks } from './markup-text';

/** Запись справочника: заголовок, приписка к нему и описание. */
interface ReferenceEntry {
  title: string;

  /** Источник или характеристики записи; пустая строка — приписки нет. */
  note: string;

  description: FeatureDescriptionNode[];
}

/**
 * Приписка к особенности: источник и выбор игрока, если он был.
 *
 * @param originName название источника особенности.
 * @param origin происхождение особенности.
 * @param choice выбор игрока внутри особенности.
 * @returns приписка к заголовку.
 */
function getFeatureNote(
  originName: string,
  origin: Character['features'][number]['origin'],
  choice: string | null,
): string {
  const parts = [originName || FEATURE_ORIGIN_LABELS[origin], choice].filter(
    (part): part is string => Boolean(part),
  );

  return parts.join(PDF_NOTE_SEPARATOR);
}

/**
 * Запись справочника по заклинанию. Своё заклинание держит характеристики и
 * описание прямо в документе, каталожное получает их дозагрузкой — дальше и то и
 * другое описывается одинаково.
 *
 * @param spell заклинание книги персонажа.
 * @param detail дозагруженная деталь каталога; не задана у своих заклинаний.
 * @returns запись справочника или null, если описания нет.
 */
function getSpellEntry(
  spell: CharacterSpell,
  detail: CatalogSpellDetail | undefined,
): ReferenceEntry | null {
  const merged = detail ? { ...spell, ...detail } : spell;

  if (!merged.description?.length) {
    return null;
  }

  return {
    title: spell.name,
    note: [
      getSpellLevelLabel(spell.level),
      spell.school,
      ...getSpellStatRows(merged).map((row) => `${row.label}: ${row.value}`),
    ]
      .filter(Boolean)
      .join(PDF_NOTE_SEPARATOR),
    description: merged.description,
  };
}

/**
 * Запись справочника по предмету инвентаря.
 *
 * @param item предмет инвентаря.
 * @param catalogDescription дозагруженное описание; не задано у своих предметов.
 * @returns запись справочника или null, если описания нет.
 */
function getItemEntry(
  item: CharacterInventoryItem,
  catalogDescription: FeatureDescriptionNode[] | undefined,
): ReferenceEntry | null {
  const description = item.description?.length
    ? item.description
    : catalogDescription;

  if (!description?.length) {
    return null;
  }

  return { title: item.name, note: item.typesLabel, description };
}

/**
 * Записи справочника: особенности, заклинания и предметы с описаниями. Порядок
 * повторяет списки листа — заклинания по кругам, предметы по категориям, — чтобы
 * запись искалась там же, где и в основных страницах.
 *
 * @param character персонаж.
 * @param descriptions дозагруженные описания каталожных записей.
 * @returns записи справочника в порядке вывода.
 */
function getReferenceEntries(
  character: Character,
  descriptions: CatalogDescriptions,
): ReferenceEntry[] {
  const features = character.features
    .filter((feature) => feature.description.length)
    .map((feature) => ({
      title: feature.name,
      note: getFeatureNote(feature.originName, feature.origin, feature.choice),
      description: feature.description,
    }));

  const uniqueSpells = [
    ...new Map(
      [...getAvailableInnateSpells(character), ...character.spells].map(
        (spell) => [spell.url, spell],
      ),
    ).values(),
  ];

  const spells = getSpellGroups(uniqueSpells, [])
    .flatMap((group) => group.spells)
    .map((spell) => getSpellEntry(spell, descriptions.spells.get(spell.url)))
    .filter((entry): entry is ReferenceEntry => entry !== null);

  const items = getInventoryGroups(character.inventory)
    .flatMap((group) => group.items)
    .map((item) => getItemEntry(item, descriptions.items.get(item.url)))
    .filter((entry): entry is ReferenceEntry => entry !== null);

  return [...features, ...spells, ...items];
}

/**
 * Одна запись справочника: заголовок с припиской и описание блоками.
 *
 * @param context документ в процессе сборки.
 * @param flow поток содержимого.
 * @param entry запись справочника.
 */
function drawReferenceEntry(
  context: PdfBuildContext,
  flow: PdfFlow,
  entry: ReferenceEntry,
): void {
  const titleSize = PDF_FONT_SIZES.value + 1.5;

  // Заголовок с описанием держатся вместе: одинокий заголовок в конце страницы
  // читается как пропавшая запись.
  flow.ensure(titleSize + PDF_FONT_SIZES.small + PDF_FONT_SIZES.body * 2);

  drawTextLine(flow.page, {
    text: entry.title,
    left: flow.left,
    top: flow.top,
    font: context.fonts.bold,
    size: titleSize,
    maxWidth: flow.width,
  });

  flow.advance(titleSize + 2);

  if (entry.note) {
    drawTextLine(flow.page, {
      text: entry.note,
      left: flow.left,
      top: flow.top,
      font: context.fonts.italic,
      size: PDF_FONT_SIZES.small + 0.5,
      color: PDF_COLORS.muted,
      maxWidth: flow.width,
    });

    flow.advance(PDF_FONT_SIZES.small + 4);
  }

  drawTextBlocks(context, flow, toPdfTextBlocks(entry.description));

  flow.advance(PDF_GAP);
}

/**
 * Справочник: полные описания особенностей, заклинаний и предметов. Страница не
 * создаётся, если описаний нет.
 *
 * @param context документ в процессе сборки.
 * @param character персонаж.
 * @param descriptions дозагруженные описания каталожных записей.
 */
export function drawReferencePage(
  context: PdfBuildContext,
  character: Character,
  descriptions: CatalogDescriptions,
): void {
  const entries = getReferenceEntries(character, descriptions);

  if (!entries.length) {
    return;
  }

  const flow = createPdfFlow(context, {
    left: PDF_PAGE_MARGIN,
    width: PDF_CONTENT_WIDTH,
    top: PDF_PAGE_MARGIN,
  });

  drawSectionHeader(context, flow, PDF_TITLES.reference);

  for (const entry of entries) {
    drawReferenceEntry(context, flow, entry);
  }
}
