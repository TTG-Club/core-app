import type { MarkdownStat } from '~ui/markup';

import type {
  CreatureAbilitiesResponse,
  CreatureActionResponse,
  CreatureDetailResponse,
} from './detail';

import { buildMarkdownEntity, joinStat, toMarkdown } from '~ui/markup';

/** Подписи характеристик в порядке строк таблицы. */
const ABILITY_LABELS: Array<[keyof CreatureAbilitiesResponse, string]> = [
  ['str', 'СИЛ'],
  ['dex', 'ЛОВ'],
  ['con', 'ТЕЛ'],
  ['int', 'ИНТ'],
  ['wis', 'МДР'],
  ['chr', 'ХАР'],
];

/** Подписи блоков с однотипным содержимым «название + описание». */
const ACTION_BLOCK_LABELS = {
  traits: 'Черты',
  actions: 'Действия',
  bonusActions: 'Бонусные действия',
  reactions: 'Реакции',
  legendary: 'Легендарные действия',
} as const;

/**
 * Собирает существо в Markdown формата Homebrewery.
 *
 * Статблок объёмнее шапки прочих разделов: за свойствами идёт таблица характеристик, затем однотипные блоки черт, действий, реакций и легендарных действий, а в конце — логово и раздел про вид существа.
 *
 * @param creature - Существо с бэкенда
 * @returns Markdown-текст существа
 */
export function getCreatureMarkdown(creature: CreatureDetailResponse): string {
  return buildMarkdownEntity({
    name: creature.name.rus,
    nameEng: creature.name.eng,
    subtitle: creature.header,
    stats: getStats(creature),
    source: creature.source,
    description: creature.description,
    extra: [
      getAbilitiesTable(creature.abilities),
      getActionBlock(ACTION_BLOCK_LABELS.traits, creature.traits),
      getActionBlock(ACTION_BLOCK_LABELS.actions, creature.actions),
      getActionBlock(ACTION_BLOCK_LABELS.bonusActions, creature.bonusActions),
      getActionBlock(ACTION_BLOCK_LABELS.reactions, creature.reactions),
      getLegendary(creature),
      getLair(creature),
      getSection(creature),
    ],
  });
}

/** Строки блока свойств; пустые отбрасывает сборщик. */
function getStats(creature: CreatureDetailResponse): MarkdownStat[] {
  const { initiative, hit } = creature;

  return [
    ['КД', creature.ac],
    ['Инициатива', joinStat([initiative?.value, wrap(initiative?.label)], ' ')],
    [
      'Хиты',
      joinStat([String(hit?.hit ?? ''), wrap(hit?.formula), hit?.text], ' '),
    ],
    // В `speed` попадают лишние пробелы («80 фт. , лазая»), поэтому строка нормализуется.
    [
      'Скорость',
      creature.speed?.replace(/\s+([,;])/g, '$1').replace(/\s{2,}/g, ' '),
    ],
    ['Навыки', joinStat((creature.skills ?? []).map(toSkill))],
    ['Уязвимости', creature.vulnerability],
    ['Сопротивления', creature.resistance],
    ['Иммунитеты', creature.immunity],
    ['Снаряжение', toInline(creature.equipments)],
    ['Чувства', creature.sense],
    ['Языки', creature.languages],
    ['ПО', creature.cr],
  ];
}

/** Навык строкой «Скрытность +6». */
function toSkill(skill: { label: string; value: string }): string {
  return joinStat([skill.label, skill.value], ' ');
}

/** Оборачивает значение в скобки; пустое остаётся пустым, чтобы не рисовать «()». */
function wrap(value: string | undefined | null): string {
  return value ? `(${value})` : '';
}

/** Значение свойства всегда однострочное: перенос разорвал бы строку `**Ключ** :: Значение`. */
function toInline(value: unknown): string {
  return toMarkdown(value)
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

/** Характеристики таблицей: значение, модификатор и спасбросок по каждой. */
function getAbilitiesTable(abilities: CreatureAbilitiesResponse): string {
  const rows = ABILITY_LABELS.filter(([key]) => abilities?.[key]).map(
    ([key, label]) => {
      const { value, mod, sav } = abilities[key];

      return `| ${label} | ${value} | ${mod} | ${sav} |`;
    },
  );

  if (!rows.length) {
    return '';
  }

  return [
    '| Хар. | Знач. | Мод. | Спас. |',
    '| :--- | :---: | :---: | :---: |',
    ...rows,
  ].join('\n');
}

/** Блок однотипных пунктов «название + описание» под общим подзаголовком. */
function getActionBlock(
  label: string,
  items: CreatureActionResponse[] | undefined,
): string {
  if (!items?.length) {
    return '';
  }

  return `##### ${label}\n\n${items.map(toActionItem).join('\n\n')}`;
}

/** Пункт блока: жирно-курсивное название и описание следом. Переносы внутри описания сохраняются — у некоторых действий там список (например перечень заклинаний по частоте). Безымянный пункт остаётся одним описанием, без пустого выделения. */
function toActionItem(item: CreatureActionResponse): string {
  const description = toMarkdown(item.description).trim();

  return item.name?.rus
    ? `***${item.name.rus}.*** ${description}`
    : description;
}

/** Легендарные действия: вводный абзац из ответа идёт перед списком самих действий. */
function getLegendary(creature: CreatureDetailResponse): string {
  const { legendary } = creature;

  if (!legendary?.actions?.length) {
    return '';
  }

  return [
    `##### ${ACTION_BLOCK_LABELS.legendary}`,
    toMarkdown(legendary.description).trim(),
    legendary.actions.map(toActionItem).join('\n\n'),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Логово: описание, эффекты и правило их окончания. */
function getLair(creature: CreatureDetailResponse): string {
  const { lair } = creature;

  if (!lair?.effects?.length && !lair?.description?.length) {
    return '';
  }

  return [
    `##### ${lair.name || 'Логово'}`,
    toMarkdown(lair.description),
    ...(lair.effects ?? []).map(toActionItem),
    toMarkdown(lair.ending),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Раздел про вид существа: места обитания, сокровища и общее описание. */
function getSection(creature: CreatureDetailResponse): string {
  const { section } = creature;

  if (!section?.description?.length) {
    return '';
  }

  const stats = [
    ['Места обитания', section.habitats],
    ['Сокровища', section.treasures],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `**${label}** :: ${value}`)
    .join('\n');

  // Название раздела бывает пустым (например у `gallows-speaker-rhw`) — тогда заголовок не рисуется, иначе получилась бы строка из одних решёток.
  return [
    section.name.rus ? `##### ${section.name.rus}` : '',
    section.subtitle ? `*${section.subtitle}*` : '',
    stats,
    toMarkdown(section.description),
  ]
    .filter(Boolean)
    .join('\n\n');
}
