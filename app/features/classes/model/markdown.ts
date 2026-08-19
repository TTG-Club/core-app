import type { Level } from '~/shared/types';
import type { MarkdownColumn, MarkdownStat } from '~ui/markup';

import type {
  ClassDetailResponse,
  ClassFeature,
  ClassFeatureOption,
  ClassInMulticlass,
  ClassMulticlassProficiency,
  ClassTable,
  MulticlassDetailResponse,
} from './detail';

import { maxBy, orderBy, range } from 'es-toolkit';

import { LEVELS } from '~/shared/consts';
import {
  buildMarkdownEntity,
  buildMarkdownTable,
  buildStatsBlock,
  escapeMarkdown,
  escapeMarkdownCell,
  joinStat,
  toMarkdown,
} from '~ui/markup';

import { MULTICLASS_ABILITY_REQUIREMENT } from './constants';
import { CasterType } from './detail';
import { getClassProficiencyBonus } from './mechanics';
import {
  FULL_CASTER_SPELL_SLOTS,
  HALF_CASTER_SPELL_SLOTS,
  MULTICLASS_SPELL_SLOTS,
  PACT_CASTER_SPELL_SLOTS_COUNT,
  PACT_CASTER_SPELL_SLOTS_LEVEL,
  THIRD_CASTER_SPELL_SLOTS,
} from './spell-slots';

/** Прочерк в ячейке — тот же, что в таблице на странице. */
const EMPTY_CELL = '—';

/** Подписи заголовков и блоков — в порядке вывода. */
const CLASS_LABELS = {
  level: 'Ур.',
  class: 'Класс',
  proficiencyBonus: 'БМ',
  features: 'Умения класса',
  spellcasterLevel: 'Уровень заклинателя',
  pactSlotsCount: 'Кол-во ячеек',
  pactSlotsLevel: 'Ур. ячейки',
  proficiency: 'Владения',
  equipment: 'Снаряжение',
  description: 'Описание',
} as const;

/** Колонки пактового заклинателя: число ячеек и их круг. */
const PACT_SLOT_COLUMNS: MarkdownColumn[] = [
  { label: CLASS_LABELS.pactSlotsCount, align: 'center' },
  { label: CLASS_LABELS.pactSlotsLevel, align: 'center' },
];

/** Вступление блока снаряжения — тем же текстом, что и на странице. */
const EQUIPMENT_INTRO =
  'Вы начинаете со следующим снаряжением в дополнение к снаряжению, полученному за вашу предысторию:';

/** Таблица ячеек заклинаний по типу заклинателя; у прочих ячеек нет. */
const SPELL_SLOTS_BY_CASTER: Partial<
  Record<CasterType, Record<Level, number[]>>
> = {
  [CasterType.FULL]: FULL_CASTER_SPELL_SLOTS,
  [CasterType.HALF]: HALF_CASTER_SPELL_SLOTS,
  [CasterType.THIRD]: THIRD_CASTER_SPELL_SLOTS,
};

/**
 * Уровень, по которому меряется ширина таблицы ячеек: на двадцатом заклинатель
 * открывает максимум кругов, поэтому число колонок берётся оттуда, а не
 * зашитым числом на каждый тип.
 */
const MAX_CLASS_LEVEL: Level = 20;

/** Умение в строке таблицы: своё либо ступень усиления (`scaling`). */
interface LeveledFeature {
  level: Level;
  name: string;
}

/**
 * Источник блока владений: обычный класс и сборка мультикласса дают его
 * одинаково, только у второй есть ещё владения при мультиклассировании.
 */
type ProficiencySource = Pick<
  ClassDetailResponse,
  'proficiency' | 'savingThrows'
> & {
  multiclassProficiency?: ClassMulticlassProficiency;
};

/**
 * Собирает класс или подкласс в Markdown формата Homebrewery.
 *
 * Порядок блоков повторяет страницу: свойства, таблица прогрессии, владения,
 * снаряжение, умения и описание в самом конце — поэтому описание уходит в
 * `extra`, а не в своё обычное место под свойствами.
 *
 * @param detail - Класс с бэкенда
 * @returns Markdown-текст класса
 */
export function getClassMarkdown(detail: ClassDetailResponse): string {
  return buildMarkdownEntity({
    name: detail.name.rus,
    nameEng: detail.name.eng,
    // У подкласса в подзаголовке родительский класс — как в шапке страницы.
    subtitle: detail.parent?.name.rus,
    stats: getStats(detail),
    source: detail.source,
    extra: [
      getProgressionTable(detail),
      getProficiencyBlock(detail),
      getEquipmentBlock(detail.equipment),
      ...detail.features.map(toFeatureBlock),
      getDescriptionBlock(detail.description),
    ],
  });
}

/**
 * Собирает сборку мультикласса в Markdown формата Homebrewery.
 *
 * От обычного класса отличается тем, что уровни в таблице — уровни персонажа,
 * а не класса: вместо разделительных строк, которыми страница отмечает смену
 * класса, здесь отдельная колонка «Класс» — в распечатанной таблице она
 * читается лучше. Ячейки заклинаний идут своей однострочной таблицей, как и
 * на странице: у мультикласса они считаются от уровня заклинателя, а не от
 * уровня персонажа.
 *
 * @param detail - Сборка мультикласса с бэкенда
 * @returns Markdown-текст сборки
 */
export function getMulticlassMarkdown(
  detail: MulticlassDetailResponse,
): string {
  return buildMarkdownEntity({
    name: detail.name.rus,
    nameEng: detail.name.eng,
    stats: getMulticlassStats(detail),
    source: detail.source,
    extra: [
      getMulticlassTable(detail),
      getMulticlassSlotsTable(detail),
      getProficiencyBlock(detail),
      ...detail.features.map(toFeatureBlock),
    ],
  });
}

/** Строки блока свойств сборки. */
function getMulticlassStats(detail: MulticlassDetailResponse): MarkdownStat[] {
  return [
    [
      'Уровень персонажа',
      detail.characterLevel ? String(detail.characterLevel) : '',
    ],
    ['Классы', getClassList(detail.multiclass)],
    [
      'Уровень заклинателя',
      detail.spellcastingLevel ? String(detail.spellcastingLevel) : '',
    ],
    ['Основная характеристика', escapeMarkdown(detail.primaryCharacteristics)],
    ['Спасброски', escapeMarkdown(detail.savingThrows)],
    ['Требования для мультиклассирования', escapeMarkdown(detail.requirements)],
  ];
}

/** Состав сборки строкой: «Воин 5 / Мистик (Великий Древний) 3». */
function getClassList(multiclass: ClassInMulticlass[] | undefined): string {
  return joinStat(
    (multiclass ?? []).map((item) =>
      joinStat(
        [
          escapeMarkdown(item.class),
          item.subclass ? `(${escapeMarkdown(item.subclass)})` : undefined,
          String(item.level),
        ],
        ' ',
      ),
    ),
    ' / ',
  );
}

/**
 * Таблица сборки: уровни персонажа до набранного, класс каждого уровня,
 * бонус мастерства, умения и собственные колонки классов.
 */
function getMulticlassTable(detail: MulticlassDetailResponse): string {
  const features = getLeveledFeatures(detail.features);
  const classByLevel = getClassByLevel(detail.multiclass);

  // Класс и умения — колонки с прозой, остальные держат короткие числа.
  const columns: MarkdownColumn[] = [
    { label: CLASS_LABELS.level, align: 'center' },
    { label: CLASS_LABELS.class, align: 'left' },
    { label: CLASS_LABELS.proficiencyBonus, align: 'center' },
    { label: CLASS_LABELS.features, align: 'left' },
    ...detail.table.map(toClassColumn),
  ];

  const rows = LEVELS.filter((level) => level <= detail.characterLevel).map(
    (level) => [
      String(level),
      classByLevel.get(level) ?? EMPTY_CELL,
      `+${getClassProficiencyBonus(level)}`,
      getFeatureNames(features, level),
      ...detail.table.map((column) =>
        escapeMarkdownCell(getScalingValue(level, column.scaling)),
      ),
    ],
  );

  return buildMarkdownTable(columns, rows);
}

/**
 * Раскладывает состав сборки по уровням персонажа: классы берутся подряд, в
 * том же порядке, в каком их набирали.
 */
function getClassByLevel(
  multiclass: ClassInMulticlass[] | undefined,
): Map<number, string> {
  const classByLevel = new Map<number, string>();

  let characterLevel = 1;

  // Уровень класса в ответе накопительный: у второго взятия того же класса
  // стоит суммарный уровень, поэтому длина отрезка считается разницей.
  const takenByClass = new Map<string, number>();

  for (const item of multiclass ?? []) {
    const taken = takenByClass.get(item.class) ?? 0;
    const segmentLength = item.level > taken ? item.level - taken : item.level;

    takenByClass.set(item.class, taken + segmentLength);

    const label = escapeMarkdownCell(
      item.subclass ? `${item.class} / ${item.subclass}` : item.class,
    );

    for (let step = 0; step < segmentLength; step++) {
      classByLevel.set(characterLevel, label);
      characterLevel++;
    }
  }

  return classByLevel;
}

/**
 * Ячейки заклинаний сборки — однострочной таблицей от уровня заклинателя.
 * У сборки без заклинателей её нет вовсе.
 */
function getMulticlassSlotsTable(detail: MulticlassDetailResponse): string {
  const spellcastingLevel = LEVELS.find(
    (level) => level === detail.spellcastingLevel,
  );

  if (spellcastingLevel === undefined) {
    return '';
  }

  if (detail.casterType === CasterType.PACT) {
    return toSlotsTable(PACT_SLOT_COLUMNS, spellcastingLevel, [
      String(PACT_CASTER_SPELL_SLOTS_COUNT[spellcastingLevel]),
      String(PACT_CASTER_SPELL_SLOTS_LEVEL[spellcastingLevel]),
    ]);
  }

  if (detail.casterType !== CasterType.MULTICLASS) {
    return '';
  }

  const slots = MULTICLASS_SPELL_SLOTS[spellcastingLevel];

  return toSlotsTable(
    range(1, slots.length + 1).map(toSlotColumn),
    spellcastingLevel,
    slots.map(toSlotCell),
  );
}

/** Однострочная таблица ячеек: слева уровень заклинателя, справа значения. */
function toSlotsTable(
  columns: MarkdownColumn[],
  spellcastingLevel: Level,
  cells: string[],
): string {
  return buildMarkdownTable(
    [{ label: CLASS_LABELS.spellcasterLevel, align: 'left' }, ...columns],
    [[String(spellcastingLevel), ...cells]],
  );
}

/** Строки блока свойств; пустые отбрасывает сборщик. */
function getStats(detail: ClassDetailResponse): MarkdownStat[] {
  return [
    ['Основная характеристика', escapeMarkdown(detail.primaryCharacteristics)],
    ['Спасброски', escapeMarkdown(detail.savingThrows)],
    [
      'Требования для мультиклассирования',
      getMulticlassRequirement(detail.primaryCharacteristics),
    ],
    ['Кость хитов', getHitDice(detail.hitDice)],
  ];
}

/**
 * Требование для мультиклассирования: характеристики приходят готовой строкой
 * с нужным соединителем, остаётся дописать минимальное значение.
 */
function getMulticlassRequirement(primaryCharacteristics: string): string {
  return primaryCharacteristics
    ? `${escapeMarkdown(primaryCharacteristics)} ${MULTICLASS_ABILITY_REQUIREMENT}`
    : '';
}

/** Кость хитов строкой «1d8 за каждый уровень». */
function getHitDice(hitDice: ClassDetailResponse['hitDice']): string {
  return hitDice ? `1${escapeMarkdown(hitDice.label)} за каждый уровень` : '';
}

/**
 * Таблица прогрессии: уровень, бонус мастерства, умения, собственные колонки
 * класса и ячейки заклинаний.
 *
 * Двухэтажной шапки («Ячейки заклинаний» над номерами кругов) в Markdown нет,
 * поэтому круги подписаны порядковыми номерами — так же набирают эту таблицу
 * в книгах.
 */
function getProgressionTable(detail: ClassDetailResponse): string {
  const features = getLeveledFeatures(detail.features);
  const spellSlots = SPELL_SLOTS_BY_CASTER[detail.casterType];
  const slotCount = spellSlots ? countSlotColumns(spellSlots) : 0;
  const isPactCaster = detail.casterType === CasterType.PACT;

  const columns: MarkdownColumn[] = [
    { label: CLASS_LABELS.level, align: 'center' },
    { label: CLASS_LABELS.proficiencyBonus, align: 'center' },
    // Умения — единственная колонка с прозой, остальные держат короткие числа.
    { label: CLASS_LABELS.features, align: 'left' },
    ...detail.table.map(toClassColumn),
    ...range(1, slotCount + 1).map(toSlotColumn),
    ...(isPactCaster ? PACT_SLOT_COLUMNS : []),
  ];

  const rows = LEVELS.map((level) => [
    String(level),
    `+${getClassProficiencyBonus(level)}`,
    getFeatureNames(features, level),
    ...detail.table.map((column) =>
      escapeMarkdownCell(getScalingValue(level, column.scaling)),
    ),
    ...(spellSlots
      ? spellSlots[level].slice(0, slotCount).map(toSlotCell)
      : []),
    ...(isPactCaster
      ? [
          String(PACT_CASTER_SPELL_SLOTS_COUNT[level]),
          String(PACT_CASTER_SPELL_SLOTS_LEVEL[level]),
        ]
      : []),
  ]);

  return buildMarkdownTable(columns, rows);
}

/** Собственная колонка класса: значения в ней короткие, потому по центру. */
function toClassColumn(column: ClassTable): MarkdownColumn {
  return { label: escapeMarkdownCell(column.name), align: 'center' };
}

/** Колонка круга заклинаний: подписана порядковым номером круга. */
function toSlotColumn(slotLevel: number): MarkdownColumn {
  return { label: `${slotLevel}-й`, align: 'center' };
}

/** Ноль ячеек этого круга на уровне рисуется прочерком, как на странице. */
function toSlotCell(count: number): string {
  return count > 0 ? String(count) : EMPTY_CELL;
}

/**
 * Сколько колонок кругов нужно этому заклинателю: считается по двадцатому
 * уровню, где открыт максимум.
 */
function countSlotColumns(spellSlots: Record<Level, number[]>): number {
  return spellSlots[MAX_CLASS_LEVEL].filter((count) => count > 0).length;
}

/**
 * Разворачивает умения в плоский список по уровням: ступени усиления
 * (`scaling`) в таблице стоят отдельными строками наравне с самим умением.
 */
function getLeveledFeatures(features: ClassFeature[]): LeveledFeature[] {
  const leveled = features.flatMap((feature) => [
    { level: feature.level, name: feature.name },
    ...(feature.scaling ?? []).map((step) => ({
      level: step.level,
      name: step.name,
    })),
  ]);

  return orderBy(leveled, ['level'], ['asc']);
}

/** Умения уровня через запятую; на пустом уровне — прочерк. */
function getFeatureNames(features: LeveledFeature[], level: Level): string {
  const names = features
    .filter((feature) => feature.level === level)
    .map((feature) => escapeMarkdownCell(feature.name));

  return joinStat(names) || EMPTY_CELL;
}

/**
 * Значение собственной колонки класса на уровне: берётся последняя ступень, не
 * превышающая уровень, — до первой ступени колонка пустует.
 */
function getScalingValue(
  level: Level,
  scaling: Array<{ level: Level; value: string }>,
): string {
  const reached = maxBy(
    scaling.filter((step) => step.level <= level),
    (step) => step.level,
  );

  return reached?.value ?? EMPTY_CELL;
}

/** Блок владений: те же строки, что в раскрывашке «Владения» на странице. */
function getProficiencyBlock(source: ProficiencySource): string {
  const { proficiency, savingThrows, multiclassProficiency } = source;

  const rows = buildStatsBlock([
    ['Доспехи', escapeMarkdown(proficiency.armor) || 'Нет'],
    ['Оружие', escapeMarkdown(proficiency.weapon) || 'Нет'],
    ['Инструменты', escapeMarkdown(proficiency.tool) || 'Нет'],
    ['Спасброски', escapeMarkdown(savingThrows)],
    ['Навыки', escapeMarkdown(proficiency.skill)],
    ...getMulticlassProficiencyRows(multiclassProficiency),
  ]);

  return `##### ${CLASS_LABELS.proficiency}\n\n${rows}`;
}

/**
 * Владения, которые даёт класс, взятый вторым: приходят только в ответе
 * мультикласса, у обычного класса этого блока нет.
 */
function getMulticlassProficiencyRows(
  multiclassProficiency: ClassMulticlassProficiency | undefined,
): MarkdownStat[] {
  if (!multiclassProficiency) {
    return [];
  }

  return [
    [
      'Доспехи при мультиклассировании',
      escapeMarkdown(multiclassProficiency.armor) || 'Нет',
    ],
    [
      'Оружие при мультиклассировании',
      escapeMarkdown(multiclassProficiency.weapon) || 'Нет',
    ],
    [
      'Инструменты при мультиклассировании',
      escapeMarkdown(multiclassProficiency.toolProficiency) || 'Нет',
    ],
    [
      'Навыки на выбор при мультиклассировании',
      multiclassProficiency.skills
        ? String(multiclassProficiency.skills)
        : 'Нет',
    ],
  ];
}

/** Блок стартового снаряжения; у подкласса его нет. */
function getEquipmentBlock(
  equipment: ClassDetailResponse['equipment'],
): string {
  const content = toMarkdown(equipment);

  return content
    ? `##### ${CLASS_LABELS.equipment}\n\n${EQUIPMENT_INTRO}\n\n${content}`
    : '';
}

/**
 * Умение класса: заголовком, под ним курсивная строка уровня с дополнением —
 * как подзаголовок раскрывашки на странице.
 */
function toFeatureBlock(feature: ClassFeature): string {
  const subtitle = joinStat(
    [
      `${feature.level}-й уровень`,
      feature.isSubclass ? 'умение подкласса' : undefined,
    ],
    ', ',
  );

  const additional = toMarkdown(feature.additional).trim();

  return [
    `##### ${escapeMarkdown(feature.name)}`,
    `*${joinStat([subtitle, additional], '. ')}.*`,
    toMarkdown(feature.description),
    getOptionsBlock(feature),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Варианты умения (боевые стили, заклинания на выбор): на странице они за
 * кнопкой, в книге печатаются следом за самим умением.
 */
function getOptionsBlock(feature: ClassFeature): string {
  if (!feature.options?.length) {
    return '';
  }

  return [
    `###### ${escapeMarkdown(feature.optionsName || feature.name)}`,
    ...feature.options.map(toOption),
  ].join('\n\n');
}

/** Вариант умения: жирно-курсивное название и описание следом. */
function toOption(option: ClassFeatureOption): string {
  const prerequisite = toMarkdown(option.prerequisite).trim();

  return [
    `***${escapeMarkdown(option.name.rus)}.***`,
    prerequisite ? `*${prerequisite}.*` : '',
    toMarkdown(option.description).trim(),
  ]
    .filter(Boolean)
    .join(' ');
}

/** Описание класса — последним блоком, как и на странице. */
function getDescriptionBlock(
  description: ClassDetailResponse['description'],
): string {
  const content = toMarkdown(description);

  return content ? `##### ${CLASS_LABELS.description}\n\n${content}` : '';
}
