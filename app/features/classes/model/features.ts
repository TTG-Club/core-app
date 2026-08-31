import type { FeatEditorRows, FeatGrantRow } from '~feats/model';

import type {
  ClassFeatureCreate,
  ClassFeatureOptionCreate,
  ClassMechanicsHolderCreate,
} from './create';

import { createGrantRow, getTakenChoiceKeys } from '~feats/model';

import {
  ABILITY_IMPROVEMENT_FEAT_CATEGORIES,
  CLASS_FEATURE_OPTION_LEVEL_BADGE,
  CLASS_FEATURE_OPTION_REMOVE_CONFIRM,
  CLASS_FEATURE_OPTIONS_EDITOR,
  CLASS_FEATURES_EDITOR,
  CLASS_OPTIONS_CHOICE_DEFAULTS,
  FIGHTING_STYLE_FEAT_CATEGORY,
  GENERAL_FEAT_CATEGORY,
  LEGACY_FEATURE_ROWS,
} from './constants';

/**
 * Умение класса в форме: чем оно описано и как читаются флаги прежних лет.
 *
 * Раньше выбор боевого стиля, выбор черты за повышение характеристик и выбор
 * навыков были отдельными полями умения — галочками и своим блоком. Теперь всё
 * это строки даров той же механики, что у черты: боевой стиль — выбор черты
 * категории «Боевой стиль», повышение характеристик — выбор общей черты (по
 * правилам 2024 года повышение и есть черта). Флаги остались в записи как
 * запасной признак для потребителей, которые про выбор черты не знают, и форма
 * выводит их из строк при сохранении, а при загрузке — заводит строки по ним.
 */

/**
 * Флаги умения, которые записываются и читаются наравне со строками даров.
 *
 * Поля необязательные: записи, сделанные до появления любого из них, хранят
 * не все.
 */
export interface LegacyFeatureFlags {
  abilityImprovement?: boolean;
  fightingStyleChoice?: boolean;
  skillChoice?: { count: number; skills: Array<string> };
}

/** Строка даров — выбор черты. */
function isFeatChoiceRow(row: FeatGrantRow): boolean {
  return (
    row.mode === 'CHOICE' && row.kinds.length === 1 && row.kinds[0] === 'FEAT'
  );
}

/**
 * Строка выбора боевого стиля: выбор черты, ограниченный ровно категорией
 * «Боевой стиль».
 *
 * @param row строка даров.
 * @returns признак выбора боевого стиля.
 */
export function isFightingStyleRow(row: FeatGrantRow): boolean {
  return (
    isFeatChoiceRow(row)
    && row.featCategories.length === 1
    && row.featCategories[0] === FIGHTING_STYLE_FEAT_CATEGORY
  );
}

/**
 * Строка выбора черты за повышение характеристик: выбор черты без ограничения
 * категорий либо с общими чертами среди них.
 *
 * @param row строка даров.
 * @returns признак выбора черты за повышение характеристик.
 */
export function isAbilityImprovementRow(row: FeatGrantRow): boolean {
  return (
    isFeatChoiceRow(row)
    && (row.featCategories.length === 0
      || row.featCategories.includes(GENERAL_FEAT_CATEGORY))
  );
}

/** Строка выбора навыков — выбор владения навыками. */
function isSkillChoiceRow(row: FeatGrantRow): boolean {
  return (
    row.mode === 'CHOICE' && row.kinds.length === 1 && row.kinds[0] === 'SKILL'
  );
}

/**
 * Флаги умения по строкам его даров — для записи и потребителей, которые
 * читают только флаги.
 *
 * @param rows строки редактора даров умения.
 * @returns флаги повышения характеристик и выбора боевого стиля.
 */
export function getLegacyFeatureFlags(rows: FeatEditorRows): {
  abilityImprovement: boolean;
  fightingStyleChoice: boolean;
} {
  return {
    abilityImprovement: rows.grants.some(isAbilityImprovementRow),
    fightingStyleChoice: rows.grants.some(isFightingStyleRow),
  };
}

/**
 * Строки даров умения, дополненные по флагам прежних лет.
 *
 * Строка заводится только когда в дарах ещё нет такой же: у записи, которую
 * уже сохранили новой формой, флаг выведен из строки, и вторая строка спросила
 * бы игрока дважды.
 *
 * @param rows строки редактора даров умения.
 * @param legacy флаги умения из записи.
 * @returns строки с выборами по флагам.
 */
export function withLegacyFeatureRows(
  rows: FeatEditorRows,
  legacy: LegacyFeatureFlags,
): FeatEditorRows {
  const grants = [...rows.grants];

  const takenKeys = (): Array<string> =>
    getTakenChoiceKeys({ ...rows, grants });

  if (legacy.fightingStyleChoice && !grants.some(isFightingStyleRow)) {
    grants.push({
      ...createGrantRow('FEAT', takenKeys()),
      mode: 'CHOICE',
      key: LEGACY_FEATURE_ROWS.fightingStyleKey,
      label: LEGACY_FEATURE_ROWS.fightingStyleLabel,
      featCategories: [FIGHTING_STYLE_FEAT_CATEGORY],
    });
  }

  if (legacy.abilityImprovement && !grants.some(isAbilityImprovementRow)) {
    grants.push({
      ...createGrantRow('FEAT', takenKeys()),
      mode: 'CHOICE',
      key: LEGACY_FEATURE_ROWS.abilityImprovementKey,
      label: LEGACY_FEATURE_ROWS.abilityImprovementLabel,
      featCategories: [...ABILITY_IMPROVEMENT_FEAT_CATEGORIES],
    });
  }

  const skillChoice = legacy.skillChoice;

  if (skillChoice && skillChoice.count > 0 && !grants.some(isSkillChoiceRow)) {
    grants.push({
      ...createGrantRow('SKILL', takenKeys()),
      mode: 'CHOICE',
      key: LEGACY_FEATURE_ROWS.skillChoiceKey,
      label: LEGACY_FEATURE_ROWS.skillChoiceLabel,
      count: skillChoice.count,
      options: skillChoice.skills.map((skill) => ({ value: skill })),
    });
  }

  return { ...rows, grants };
}

/**
 * Сколько блоков механики заполнено у умения или его варианта. Списки длинные,
 * а механика свёрнута: без пометки автор не видит, что настроено.
 *
 * @param holder умение или вариант из состояния формы.
 * @returns число заполненных блоков.
 */
export function getClassMechanicsFilledBlocksCount(
  holder: ClassMechanicsHolderCreate,
): number {
  return [
    holder.editorRows?.grants.length ?? 0,
    holder.editorRows?.modifiers.length ?? 0,
    holder.editorRows?.counters.length ?? 0,
    holder.mechanics?.spells.spells.length ?? 0,
    holder.mechanics?.spellList.groups.length ?? 0,
    holder.activeEffects.length,
  ].filter(Boolean).length;
}

/**
 * Подпись бейджа выбираемого списка вариантов: сколько из скольких берут и до
 * скольких это число дорастает. Справочный список бейджа с выбором не получает
 * — там важна только длина списка.
 *
 * @param feature умение из состояния формы.
 * @returns подпись бейджа; пусто — список только справочный.
 */
export function getClassFeatureOptionsChoiceBadge(
  feature: ClassFeatureCreate,
): string {
  const choice = feature.optionsChoice;

  if (!choice) {
    return '';
  }

  const steps = choice.scaling.map((step) => step.count);

  const start = choice.count ?? steps[0] ?? CLASS_OPTIONS_CHOICE_DEFAULTS.count;
  const total = Math.max(start, ...steps);
  const range = total > start ? `${start}–${total}` : `${start}`;

  return `${CLASS_FEATURES_EDITOR.optionsChoiceBadge}${range} ${CLASS_FEATURES_EDITOR.optionsChoiceBadgeOf} ${feature.options.length}`;
}

/**
 * Подпись бейджа механики варианта: сколько блоков механики у него заполнено.
 * Список вариантов свёрнут строками, и без бейджа автор не видит, у какого из
 * них есть своя механика.
 *
 * @param option вариант умения из состояния формы.
 * @returns подпись бейджа; пусто — своей механики у варианта нет.
 */
export function getClassOptionMechanicsBadge(
  option: ClassFeatureOptionCreate,
): string {
  const filledBlocksCount = getClassMechanicsFilledBlocksCount(option);

  if (!filledBlocksCount) {
    return '';
  }

  return `${CLASS_FEATURE_OPTIONS_EDITOR.mechanicsBadge}${filledBlocksCount}`;
}

/**
 * Подпись уровня в шапке свёрнутого варианта: с какого уровня класса вариант
 * доступен.
 *
 * @param level уровень доступа варианта.
 * @returns подпись бейджа; `undefined` — вариант доступен сразу, и бейджа нет.
 */
export function getClassFeatureOptionLevelBadge(
  level: number | undefined,
): string | undefined {
  if (!level) {
    return undefined;
  }

  return `${CLASS_FEATURE_OPTION_LEVEL_BADGE.prefix}${level}${CLASS_FEATURE_OPTION_LEVEL_BADGE.suffix}`;
}

/**
 * Текст подтверждения удаления варианта умения.
 *
 * @param name название варианта; пусто — вариант ещё не назван.
 * @returns вопрос с названием варианта, если оно есть.
 */
export function getClassFeatureOptionRemoveDescription(name: string): string {
  const trimmed = name.trim();

  const subject = trimmed
    ? `«${trimmed}» ${CLASS_FEATURE_OPTION_REMOVE_CONFIRM.named}`
    : CLASS_FEATURE_OPTION_REMOVE_CONFIRM.unnamed;

  return `${subject}${CLASS_FEATURE_OPTION_REMOVE_CONFIRM.suffix}`;
}

/**
 * Подпись уровня в шапке свёрнутого умения.
 *
 * @param level уровень умения.
 * @returns подпись бейджа.
 */
export function getClassFeatureLevelBadge(level: number): string {
  return `${level} ${CLASS_FEATURES_EDITOR.levelSuffix}`;
}
