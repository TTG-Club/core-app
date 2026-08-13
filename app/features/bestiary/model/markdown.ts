import type { MarkdownColumn, MarkdownStat } from '~ui/markup';

import type {
  CreatureAbilitiesResponse,
  CreatureActionResponse,
  CreatureDetailResponse,
} from './detail';

import {
  buildMarkdownEntity,
  buildMarkdownTable,
  buildStatsBlock,
  escapeMarkdown,
  escapeMarkdownCell,
  joinStat,
  toInlineValue,
  toMarkdown,
} from '~ui/markup';

/** Колонки таблицы характеристик — в порядке вывода. */
const ABILITY_COLUMNS: MarkdownColumn[] = [
  { label: 'Хар.', align: 'left' },
  { label: 'Знач.', align: 'center' },
  { label: 'Мод.', align: 'center' },
  { label: 'Спас.', align: 'center' },
];

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

/** Подписи свойств в разделе про вид существа. */
const SECTION_LABELS = {
  habitats: 'Места обитания',
  treasures: 'Сокровища',
} as const;

/** Запасное название блока логова: у части существ `lair.name` пустое. */
const LAIR_FALLBACK_NAME = 'Логово';

/**
 * Собирает существо в Markdown формата Homebrewery.
 *
 * Статблок объёмнее шапки прочих разделов: за свойствами идёт таблица
 * характеристик, затем однотипные блоки черт, действий, реакций и
 * легендарных действий, а в конце — логово и раздел про вид существа.
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

  // Значения, кроме снаряжения, приходят сырой строкой из API и разметкой не
  // являются: звёздочка или бэктик в них уехали бы в Homebrewery как разметка.
  return [
    ['КД', escapeMarkdown(creature.ac)],
    [
      'Инициатива',
      joinStat(
        [
          escapeMarkdown(initiative.value),
          toParenthesized(escapeMarkdown(initiative.label)),
        ],
        ' ',
      ),
    ],
    [
      'Хиты',
      joinStat(
        [
          // `hit` — число, экранировать в нём нечего.
          String(hit.hit),
          toParenthesized(escapeMarkdown(hit.formula)),
          escapeMarkdown(hit.text),
        ],
        ' ',
      ),
    ],
    // В `speed` попадают лишние пробелы («80 фт. , лазая»), поэтому строка
    // нормализуется.
    [
      'Скорость',
      escapeMarkdown(
        creature.speed.replace(/\s+([,;])/g, '$1').replace(/\s{2,}/g, ' '),
      ),
    ],
    ['Навыки', joinStat((creature.skills ?? []).map(toSkill))],
    ['Уязвимости', escapeMarkdown(creature.vulnerability)],
    ['Сопротивления', escapeMarkdown(creature.resistance)],
    ['Иммунитеты', escapeMarkdown(creature.immunity)],
    ['Снаряжение', toInlineValue(creature.equipments)],
    ['Чувства', escapeMarkdown(creature.sense)],
    ['Языки', escapeMarkdown(creature.languages)],
    ['ПО', escapeMarkdown(creature.cr)],
  ];
}

/** Навык строкой «Скрытность +6». */
function toSkill(skill: { label: string; value: string }): string {
  return joinStat(
    [escapeMarkdown(skill.label), escapeMarkdown(skill.value)],
    ' ',
  );
}

/**
 * Оборачивает значение в скобки; пустое остаётся пустым, чтобы не рисовать
 * «()».
 */
function toParenthesized(value: string | undefined | null): string {
  return value ? `(${value})` : '';
}

/**
 * Характеристики таблицей: значение, модификатор и спасбросок по каждой.
 *
 * Значения — сырые строки из API, поэтому кроме парных символов гасится
 * пайп: таблица собрана вручную, мимо `renderCell`, и литеральный пайп
 * добавил бы колонку. Подписи берутся из `ABILITY_LABELS` — это наш
 * литерал, экранировать в нём нечего.
 */
function getAbilitiesTable(abilities: CreatureAbilitiesResponse): string {
  const rows = ABILITY_LABELS.filter(([key]) => abilities[key]).map(
    ([key, label]) => {
      // Поля ответа названы сокращённо, поэтому переименовываются на месте.
      const { value, mod: modifier, sav: save } = abilities[key];

      return [
        label,
        escapeMarkdownCell(value),
        escapeMarkdownCell(modifier),
        escapeMarkdownCell(save),
      ];
    },
  );

  if (!rows.length) {
    return '';
  }

  return buildMarkdownTable(ABILITY_COLUMNS, rows);
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

/**
 * Пункт блока: жирно-курсивное название и описание следом. Переносы внутри
 * описания сохраняются — у некоторых действий там список (например перечень
 * заклинаний по частоте). Безымянный пункт остаётся одним описанием, без
 * пустого выделения.
 */
function toActionItem(item: CreatureActionResponse): string {
  const description = toMarkdown(item.description).trim();

  return item.name.rus
    ? `***${escapeMarkdown(item.name.rus)}.*** ${description}`
    : description;
}

/**
 * Легендарные действия: вводный абзац из ответа идёт перед списком самих
 * действий.
 */
function getLegendary(creature: CreatureDetailResponse): string {
  const { legendary } = creature;

  if (!legendary.actions?.length) {
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

/**
 * Логово: описание, эффекты и правило их окончания.
 *
 * Блок рисуется, если есть хоть одно из полей, а придти без ключа может
 * любое, — поэтому эффекты разворачиваются из нормализованного массива:
 * существо с описанием, но без эффектов, роняло бы сборку на `.map`.
 */
function getLair(creature: CreatureDetailResponse): string {
  const { lair } = creature;

  const effects = lair.effects ?? [];

  if (!effects.length && !lair.description?.length) {
    return '';
  }

  return [
    `##### ${escapeMarkdown(lair.name) || LAIR_FALLBACK_NAME}`,
    toMarkdown(lair.description),
    ...effects.map(toActionItem),
    toMarkdown(lair.ending),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Раздел про вид существа: места обитания, сокровища и общее описание. */
function getSection(creature: CreatureDetailResponse): string {
  const { section } = creature;

  // Хватает любого из трёх полей — то же условие, что и у блока на странице
  // существа: описание бывает пустым, а места обитания с сокровищами
  // указаны.
  if (!section.description?.length && !section.habitats && !section.treasures) {
    return '';
  }

  const stats = buildStatsBlock([
    [SECTION_LABELS.habitats, escapeMarkdown(section.habitats)],
    [SECTION_LABELS.treasures, escapeMarkdown(section.treasures)],
  ]);

  // Название раздела бывает пустым (например у `gallows-speaker-rhw`) —
  // тогда заголовок не рисуется, иначе получилась бы строка из одних решёток.
  return [
    section.name.rus ? `##### ${escapeMarkdown(section.name.rus)}` : '',
    section.subtitle ? `*${escapeMarkdown(section.subtitle)}*` : '',
    stats,
    toMarkdown(section.description),
  ]
    .filter(Boolean)
    .join('\n\n');
}
