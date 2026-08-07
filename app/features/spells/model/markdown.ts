import type { MarkdownStat } from '~ui/markup';

import type { SpellDetailAffiliationItem, SpellDetailResponse } from './detail';

import { buildMarkdownEntity, joinStat, toMarkdown } from '~ui/markup';

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

/** Строка уровня: у заговоров вместо номера слово, у остальных — порядковое числительное. */
function getLevelLabel(level: number): string {
  return level ? `${level}-й уровень` : 'Заговор';
}

/** Строки блока свойств. */
function getStats(spell: SpellDetailResponse): MarkdownStat[] {
  // `castingTime` и `duration` приходят готовыми строками и уже содержат пометки «или Ритуал» и «Концентрация, до ...» — собирать их из флагов не нужно.
  const stats: MarkdownStat[] = [
    ['Время накладывания', spell.castingTime],
    ['Дистанция', spell.range],
    ['Компоненты', getComponents(spell.components)],
    ['Длительность', spell.duration],
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
    components.m ? `${COMPONENT_LABELS.m} (${components.m})` : undefined,
  ]);
}

/**
 * Имена связанных сущностей одной строкой. Суффикс источника («Волшебник [PHB]») в книге только шумит, но без него один и тот же класс из разных источников даёт дубли — поэтому после срезки список ещё и дедуплицируется.
 */
function getAffiliationNames(items: SpellDetailAffiliationItem[]): string {
  const names = items.map((item) =>
    item.name.replace(SOURCE_SUFFIX_REGEXP, '').trim(),
  );

  return joinStat([...new Set(names)]);
}

/** Блок «более высокой ячейкой»: подпись жирная, весь абзац — курсивом, как в книгах. */
function getUpper(spell: SpellDetailResponse): string | undefined {
  if (!spell.upper?.length) {
    return undefined;
  }

  const label = spell.level
    ? 'Накладывание более высокой ячейкой.'
    : 'Улучшение заговора.';

  return `***${label}** ${toMarkdown(spell.upper)}*`;
}
