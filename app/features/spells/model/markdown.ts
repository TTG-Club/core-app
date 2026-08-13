import type { MarkdownStat } from '~ui/markup';

import type { SpellDetailAffiliationItem, SpellDetailResponse } from './detail';

import {
  buildMarkdownEntity,
  escapeMarkdown,
  joinStat,
  toMarkdown,
} from '~ui/markup';

/** Подписи групп связанных сущностей — в порядке вывода. */
const AFFILIATION_LABELS: Array<
  [keyof NonNullable<SpellDetailResponse['affiliation']>, string]
> = [
  ['classes', 'Классы'],
  ['subclasses', 'Подклассы'],
  ['species', 'Виды'],
  ['lineages', 'Происхождения'],
  ['feats', 'Черты'],
];

/** Подписи компонентов; материальный дополняется описанием в скобках. */
const COMPONENT_LABELS = {
  v: 'В',
  s: 'С',
  m: 'М',
} as const;

/** Суффикс источника в названии связанной сущности: «Волшебник [PHB]». */
const SOURCE_SUFFIX_REGEXP = /\s*\[[^\]]*\]\s*$/;

/**
 * Собирает заклинание в Markdown формата Homebrewery.
 *
 * @param spell - Заклинание с бэкенда
 * @returns Markdown-текст заклинания
 */
export function getSpellMarkdown(spell: SpellDetailResponse): string {
  return buildMarkdownEntity({
    name: spell.name.rus,
    nameEng: spell.name.eng,
    subtitle: `${getLevelLabel(spell.level)}, ${spell.school.toLocaleLowerCase('ru')}`,
    stats: getStats(spell),
    source: spell.source,
    description: spell.description,
    extra: [getUpper(spell)],
  });
}

/**
 * Строка уровня: у заговоров вместо номера слово, у остальных — порядковое
 * числительное.
 */
function getLevelLabel(level: number): string {
  return level ? `${level}-й уровень` : 'Заговор';
}

/** Строки блока свойств. */
function getStats(spell: SpellDetailResponse): MarkdownStat[] {
  // `castingTime` и `duration` приходят готовыми строками и уже содержат
  // пометки «или Ритуал» и «Концентрация, до ...» — собирать их из флагов
  // не нужно.
  const stats: MarkdownStat[] = [
    ['Время накладывания', escapeMarkdown(spell.castingTime)],
    ['Дистанция', escapeMarkdown(spell.range)],
    ['Компоненты', getComponents(spell.components)],
    ['Длительность', escapeMarkdown(spell.duration)],
  ];

  for (const [key, label] of AFFILIATION_LABELS) {
    const items = spell.affiliation?.[key];

    if (items?.length) {
      stats.push([label, getAffiliationNames(items)]);
    }
  }

  return stats;
}

/** Компоненты одной строкой: «В, С, М (описание)». */
function getComponents(components: SpellDetailResponse['components']): string {
  return joinStat([
    components.v ? COMPONENT_LABELS.v : undefined,
    components.s ? COMPONENT_LABELS.s : undefined,
    components.m
      ? `${COMPONENT_LABELS.m} (${escapeMarkdown(components.m)})`
      : undefined,
  ]);
}

/**
 * Имена связанных сущностей одной строкой. Суффикс источника («Волшебник
 * [PHB]») в книге только шумит, но без него один и тот же класс из разных
 * источников даёт дубли — поэтому после срезки список ещё и
 * дедуплицируется.
 */
function getAffiliationNames(items: SpellDetailAffiliationItem[]): string {
  const names = items.map((item) =>
    escapeMarkdown(item.name.replace(SOURCE_SUFFIX_REGEXP, '').trim()),
  );

  return joinStat([...new Set(names)]);
}

/**
 * Блок «более высокой ячейкой»: подпись жирная, весь абзац — курсивом, как в
 * книгах.
 *
 * Курсив не переживает пустую строку, поэтому оборачивается каждый блок
 * отдельно: обёртка вокруг всего текста развалилась бы, будь в `upper`
 * больше одного абзаца.
 *
 * Подпись приклеивается к первому блоку, только если он однострочный.
 * Начнись `upper` со списка или таблицы, приклеенная подпись съела бы
 * первый пункт («**Подпись.** - пункт» пунктом уже не является), поэтому
 * там она выносится отдельным абзацем перед блоком.
 */
function getUpper(spell: SpellDetailResponse): string | undefined {
  if (!spell.upper?.length) {
    return undefined;
  }

  const label = spell.level
    ? 'Накладывание более высокой ячейкой.'
    : 'Улучшение заговора.';

  const [first, ...rest] = toMarkdown(spell.upper)
    .split('\n\n')
    .filter(Boolean);

  if (!first) {
    return undefined;
  }

  // Над списком и таблицей подпись стоит жирной строкой-зачином без курсива:
  // в книгах она набрана так же.
  const head = isMultiline(first)
    ? [`**${label}**`, first]
    : [toEmphasized(`**${label}** ${first}`)];

  return [...head, ...rest.map(toEmphasized)].join('\n\n');
}

/**
 * Оборачивает блок в курсив. Многострочный блок (список, таблица) остаётся
 * как есть: курсив не переживает перенос строки, а звёздочки по краям
 * разъехались бы по разным пунктам списка.
 */
function toEmphasized(block: string): string {
  return isMultiline(block) ? block : `*${block}*`;
}

/** Список и таблица приходят многострочным блоком, абзац — однострочным. */
function isMultiline(block: string): boolean {
  return block.includes('\n');
}
