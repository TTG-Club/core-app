import type { FeatEditorRows, FeatGrantRow } from '~feats/model';

import type { ClassFeatureCreate } from './create';

import { createGrantRow, getTakenChoiceKeys } from '~feats/model';

import {
  ABILITY_IMPROVEMENT_FEAT_CATEGORIES,
  CLASS_FEATURES_EDITOR,
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
 * Сколько блоков механики умения заполнено. Список умений длинный, а механика
 * свёрнута: без пометки автор не видит, какие умения настроены.
 *
 * @param feature умение из состояния формы.
 * @returns число заполненных блоков.
 */
export function getClassFeatureFilledBlocksCount(
  feature: ClassFeatureCreate,
): number {
  return [
    feature.editorRows?.grants.length ?? 0,
    feature.editorRows?.modifiers.length ?? 0,
    feature.editorRows?.counters.length ?? 0,
    feature.mechanics?.spells.spells.length ?? 0,
    feature.mechanics?.spellList.groups.length ?? 0,
    feature.activeEffects.length,
  ].filter(Boolean).length;
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
