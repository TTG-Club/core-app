import type { ActiveEffect } from '~active-effects/model';
import type {
  DamageFormulaPart,
  DamageFormulaTarget,
} from '~ui/damage-formula';
import type { EditorBaseInfoState } from '~ui/editor';

import { z } from 'zod';

import { AbilityKey } from '~/shared/types';
import { normalizeLoadedActiveEffects } from '~active-effects/model';
import {
  createEmptyDamageFormulaPart,
  DAMAGE_TYPE_TAGS,
  DEFAULT_DAMAGE_FORMULA_TARGET,
  getDamageFormulaTypes,
  isDamageFormulaTarget,
  parseLoadedDamageFormulaParts,
} from '~ui/damage-formula';

import {
  SPELL_DELIVERY_TYPE_OPTIONS,
  SPELL_HEALING_TYPE_TAGS,
  SPELL_SAVE_EFFECT_OPTIONS,
  SPELL_TARGET_TYPE_OPTIONS,
  SPELL_USES_RECOVERY_OPTIONS,
} from './constants';

/**
 * Тип цели заклинания.
 */
export type SpellTargetType =
  | 'CREATURE'
  | 'OBJECT'
  | 'POINT'
  | 'SELF'
  | 'AREA'
  | 'NONE';

export type SpellSaveEffect = 'HALF' | 'NONE' | 'SPECIAL';

/**
 * Вложенный объект области воздействия.
 */
export interface SpellAreaOfEffect {
  type: string | undefined; // тип области (сфера, линия, конус, куб, цилиндр)
  value1: number | undefined; // первое значение (радиус/длина)
  value2: number | undefined; // второе значение (высота/ширина, только для LINE и CYLINDER)
}

/**
 * Режим распределения снарядов по целям при касте.
 * `any` — форменный дефолт «свободно», на сервер НЕ пишется (поле пустое).
 * Зеркало `SpellProjectiles.targetDistribution` из VTTG.
 */
export type SpellProjectileDistribution = 'any' | 'single' | 'distinct';

/**
 * Способ применения заклинания — как оно достаёт цель. Зеркало
 * `SpellDeliveryType` из VTTG: рукопашная и дальнобойная добавляют бросок
 * атаки, «на себя» включает автопопадание, касание требует досягаемости.
 */
export type SpellDeliveryType =
  | 'ranged'
  | 'melee'
  | 'self'
  | 'touch'
  | 'sight'
  | 'none';

/**
 * Способ восстановления зарядов заклинания. Зеркало `SpellUsesRecovery` из
 * VTTG: `atWill` — без лимита, заряды не тратятся.
 */
export type SpellUsesRecovery = 'atWill' | 'shortRest' | 'longRest';

/**
 * Заряды использования заклинания — для врождённой и расовой магии и
 * заклинаний существ, не тратящих ячейки заклинателя.
 *
 * Текущее число зарядов справочник не хранит: оно принадлежит конкретному
 * персонажу, а не записи. Потребитель получает полный запас.
 */
export interface SpellUses {
  max: number | undefined; // максимум зарядов
  recovery: SpellUsesRecovery; // чем восстанавливаются
}

/**
 * Усиление заклинания при трате ячейки выше его круга. Не задано — потребитель
 * разбирает текст «На более высоких уровнях», как разбирал раньше.
 */
export interface SpellScaling {
  additionalDice: string | undefined; // доп. урон за круг (напр. 1к6)
  additionalTargets: number | undefined; // доп. целей или снарядов за круг
  description: string | undefined; // текстовое описание усиления
}

/**
 * Тир масштабирования заговора: с указанного уровня персонажа набор частей
 * урона заменяется целиком — так меняется не только кость, но и тип урона.
 */
export interface SpellCantripScalingTier {
  level: number | undefined; // минимальный уровень персонажа
  parts: DamageFormulaPart[]; // полный набор частей на этом уровне
}

/**
 * Порог уровня персонажа → полное число снарядов (для заговоров).
 * Начиная с указанного уровня базовое число снарядов заменяется целиком.
 */
export interface SpellProjectileCountTier {
  level: number | undefined; // минимальный уровень персонажа
  count: number | undefined; // полное число снарядов с этого уровня
}

/**
 * Снарядный режим заклинания (Волшебная стрела, Мистический заряд, Палящий
 * луч): каждый снаряд — отдельный бросок урона (и атаки, если заклинание
 * атакующее), снаряды распределяются по целям. Зеркало `SpellProjectiles`
 * из VTTG: `damageFormulas` описывают урон ОДНОГО снаряда.
 */
export interface SpellProjectiles {
  count: number | undefined; // базовое число снарядов
  perSlotLevel?: number; // доп. снарядов за круг ячейки выше базового (уровневые)
  countByCharacterLevel?: SpellProjectileCountTier[]; // пороги уровня (заговоры)
  targetDistribution?: 'single' | 'distinct'; // распределение по целям
}

/**
 * Единый объект воздействия заклинания.
 * Объединяет damageType, savingThrow, areaOfEffect, attackType и другие поля.
 */
export interface SpellEffect {
  targetType?: SpellTargetType;
  targetCount?: number;
  areaOfEffect?: SpellAreaOfEffect;
  attackType?: string;
  deliveryType?: SpellDeliveryType;
  attackBonus?: number;
  autoHit?: boolean;
  projectiles?: SpellProjectiles;
  uses?: SpellUses;
  scaling?: SpellScaling;
  cantripScalingTiers?: SpellCantripScalingTier[];
  damageFormulas?: string[];
  damageFormulaTargets?: DamageFormulaTarget[]; // цели частей урона, по индексам damageFormulas
  damageFormulaRequiresDamage?: boolean[]; // «только если нанесён урон», по индексам damageFormulas
  damageFormula?: string;

  /**
   * Типы урона только для фильтра каталога — фильтр смотрит лишь сюда. В расчёте
   * не участвуют: урон считают формулы, но по ним не видно урона на выбор или
   * частей, идущих поочерёдно. Типы из формул дописываются при сохранении.
   */
  damageTypes?: string[];
  healingTypes?: string[];
  savingThrows?: AbilityKey[];
  saveEffect?: SpellSaveEffect;
  conditions?: string[];

  /**
   * Характеристика, от которой считаются Сл спасброска и бонус атаки этого
   * заклинания.
   *
   * Обычно её задаёт заклинатель, а не запись справочника: «Огненный снаряд»
   * считается от Интеллекта у волшебника и от Харизмы у колдуна. Поле нужно
   * тем заклинаниям, у которых характеристика своя независимо от источника —
   * хоумбрю и заклинаниям, выданным чертой. Не задана — лист персонажа возьмёт
   * характеристику класса.
   */
  spellcastingAbility?: AbilityKey;
}

export interface SpellCreate extends EditorBaseInfoState {
  description: string; // описание маркап
  upper: string | undefined; // "На более высоких уровнях"
  level: number; // уровень заклинания, 0 - заговор
  school: SpellSchool; // школа
  range: Array<SpellRange>; // дистанция
  duration: Array<SpellDuration>; // длительность
  castingTime: Array<SpellCastingTime>; // время накладывания
  components: SpellComponents; // компоненты
  affiliations: SpellAffiliation; // привязка заклинания к сущностям
  effect: SpellEffect; // единый объект воздействия
  activeEffects: ActiveEffect[]; // активные эффекты для экспорта в VTTG
}

export interface SpellSchool {
  school: string | undefined; // школа
  additionalType: string | undefined; // подшкола
}

export interface SpellRange {
  unit: string | undefined; // единицы измерения
  value: number | undefined; // значение дистанции
  custom: string | undefined; // кастомное значение (666 световых лет)
}

export interface SpellDuration {
  concentration: boolean;
  value: number | undefined; // значение длительности
  unit: string | undefined; // единицы измерения (минута/час)
  custom: string | undefined; // кастомное значение (666 веков)
}

export interface SpellCastingTime {
  value: number | undefined; // значение времени
  unit: string | undefined; // единицы измерения (час/минута/действие)
  custom: string | undefined; // кастомное значение (666 миллисекунд)
}

export interface SpellComponents {
  v: boolean; // вербальный компонент
  s: boolean; // соматический компонент
  m: SpellMaterialComponent | undefined; // материальные компоненты
}

export interface SpellMaterialComponent {
  text: string; // название
  withCost: boolean; // имеет стоимость
  consumable: boolean; // расходуемый да/нет
}

export interface SpellAffiliation {
  classes: Array<string>; // урлы классов
  subclasses: Array<string>; // урлы архетипов классов
  species: Array<string>; // урлы видов
  lineages: Array<string>; // урлы происхождений видов
  feats: Array<string>; // урлы черт
}

/**
 * Создаёт начальное состояние SpellEffect с заполненными массивами и вложенным areaOfEffect,
 * чтобы v-model не обращался к undefined.
 */
export function createEmptySpellEffect(): SpellEffect {
  return {
    targetType: undefined,
    targetCount: undefined,
    areaOfEffect: {
      type: undefined,
      value1: undefined,
      value2: undefined,
    },
    attackType: undefined,
    deliveryType: undefined,
    attackBonus: undefined,
    autoHit: false,
    projectiles: undefined,
    uses: undefined,
    scaling: undefined,
    cantripScalingTiers: [],
    damageFormulas: [],
    damageFormulaTargets: [],
    damageFormulaRequiresDamage: [],
    damageFormula: undefined,
    damageTypes: [],
    healingTypes: [],
    savingThrows: [],
    saveEffect: undefined,
    conditions: [],
    spellcastingAbility: undefined,
  };
}

/** Способ восстановления зарядов по умолчанию: он же самый частый. */
export const DEFAULT_SPELL_USES_RECOVERY: SpellUsesRecovery = 'longRest';

/**
 * Создаёт заряды по умолчанию (галочка «Ограниченное число применений»).
 *
 * @returns заряды с одним применением до продолжительного отдыха.
 */
export function createEmptySpellUses(): SpellUses {
  return {
    max: 1,
    recovery: DEFAULT_SPELL_USES_RECOVERY,
  };
}

/**
 * Создаёт пустое усиление на высших кругах (галочка «Масштабирование» включена).
 *
 * @returns усиление с незаполненными полями.
 */
export function createEmptySpellScaling(): SpellScaling {
  return {
    additionalDice: undefined,
    additionalTargets: undefined,
    description: undefined,
  };
}

/**
 * Создаёт пустой тир масштабирования заговора с одной частью урона.
 *
 * @returns тир без уровня и с пустой частью урона.
 */
export function createEmptySpellCantripScalingTier(): SpellCantripScalingTier {
  return {
    level: undefined,
    parts: [createEmptyDamageFormulaPart()],
  };
}

/**
 * Создаёт начальное состояние снарядного режима (галочка «Снаряды» включена).
 * Базовое число — 1, распределение по целям свободное (targetDistribution пуст).
 */
export function createEmptySpellProjectiles(): SpellProjectiles {
  return {
    count: 1,
    perSlotLevel: undefined,
    countByCharacterLevel: [],
    targetDistribution: undefined,
  };
}

/**
 * Нормализует снарядный режим перед отправкой на сервер:
 * - базовое число снарядов не меньше 1;
 * - perSlotLevel пишется только если > 0;
 * - пороги уровня очищаются от незаполненных и сортируются по возрастанию;
 * - targetDistribution `any` (свободно) не пишется.
 */
function normalizeSpellProjectiles(
  projectiles: SpellProjectiles,
): SpellProjectiles {
  const count =
    projectiles.count && projectiles.count > 0 ? projectiles.count : 1;

  const tiers = (projectiles.countByCharacterLevel ?? [])
    .filter(
      (tier) =>
        tier.level !== undefined
        && tier.level > 0
        && tier.count !== undefined
        && tier.count > 0,
    )
    .map((tier) => ({ level: tier.level, count: tier.count }))
    .sort((tierA, tierB) => (tierA.level ?? 0) - (tierB.level ?? 0));

  return {
    count,
    perSlotLevel:
      projectiles.perSlotLevel && projectiles.perSlotLevel > 0
        ? projectiles.perSlotLevel
        : undefined,
    countByCharacterLevel: tiers.length > 0 ? tiers : undefined,
    targetDistribution:
      projectiles.targetDistribution === 'single'
      || projectiles.targetDistribution === 'distinct'
        ? projectiles.targetDistribution
        : undefined,
  };
}

/**
 * Возвращает тег типа урона заклинания.
 */
function getSpellDamageTypeTag(damageType: string): string {
  return DAMAGE_TYPE_TAGS[damageType] ?? damageType;
}

/**
 * Создает формулу урона с привязанным тегом типа урона.
 */
function createSpellDamageFormula(formula: string, damageType: string): string {
  return `${formula}@${getSpellDamageTypeTag(damageType)}`;
}

/**
 * Возвращает тег типа лечения для формулы заклинания.
 */
function getSpellHealingTypeTag(healingType: string): string | undefined {
  return SPELL_HEALING_TYPE_TAGS[healingType];
}

/**
 * Добавляет тег к формуле, если он еще не указан.
 */
function appendMissingFormulaTag(formula: string, tag: string): string {
  if (formula.includes(`@${tag}`)) {
    return formula;
  }

  return `${formula}@${tag}`;
}

/**
 * Мигрирует legacy healingTypes в теги формулы лечения.
 */
function migrateSpellEffectHealingFormulas(effect: SpellEffect): SpellEffect {
  if (!effect.healingTypes?.length || !effect.damageFormulas?.length) {
    return effect;
  }

  const healingTags = effect.healingTypes
    .map(getSpellHealingTypeTag)
    .filter((tag) => tag !== undefined);

  if (healingTags.length === 0) {
    return {
      ...effect,
      healingTypes: [],
    };
  }

  return {
    ...effect,
    damageFormulas: effect.damageFormulas.map((formula) =>
      healingTags.reduce(appendMissingFormulaTag, formula),
    ),
    healingTypes: [],
  };
}

/**
 * Legacy-теги цели, которые редактор писал прямо в формулу урона. Ни один
 * потребитель их не понимает: VTTG знает только `@target.full`/`@target.notFull`,
 * а лист персонажа выбрасывает формулу с незнакомым тегом целиком.
 */
const LEGACY_DAMAGE_TARGET_TAGS: Array<{
  tag: string;
  target: DamageFormulaTarget;
}> = [
  { tag: '@target.self', target: 'self' },
  { tag: '@target.separate', target: 'choose' },
];

const LEGACY_DAMAGE_TARGET_TAG_PATTERN = /@target\.(?:self|separate)\b/g;

/**
 * Собирает части урона редактора из параллельных массивов SpellEffect.
 *
 * @param effect воздействие заклинания.
 * @returns части урона в порядке формул; цель без пары — `selected`.
 */
export function getSpellDamageFormulaParts(
  effect: SpellEffect,
): DamageFormulaPart[] {
  const damageFormulaTargets = effect.damageFormulaTargets ?? [];
  const damageFormulaRequiresDamage = effect.damageFormulaRequiresDamage ?? [];

  return (effect.damageFormulas ?? []).map((formula, index) => ({
    formula,
    target: damageFormulaTargets[index] ?? DEFAULT_DAMAGE_FORMULA_TARGET,
    requiresDamage: damageFormulaRequiresDamage[index] === true,
  }));
}

/**
 * Типы урона из тегов `@dmg.*` формул заклинания: базовых частей и тиров
 * масштабирования заговора. Та же выборка у сохранения на бэке и у миграции,
 * заполнившей поле у старых записей.
 *
 * @param effect воздействие заклинания.
 * @returns ключи типов урона без повторов, в порядке появления.
 */
export function getSpellFormulaDamageTypes(effect: SpellEffect): Array<string> {
  const tierFormulas = (effect.cantripScalingTiers ?? []).flatMap((tier) =>
    tier.parts.map((part) => part.formula),
  );

  const formulaTypes = [
    ...(effect.damageFormulas ?? []),
    ...tierFormulas,
  ].flatMap(getDamageFormulaTypes);

  return [...new Set(formulaTypes)];
}

/**
 * Типы урона для фильтра каталога: отмеченные автором и следом — типы из формул.
 * Ровно этот список уходит в `effect.damageTypes` при сохранении.
 *
 * @param effect воздействие заклинания.
 * @returns ключи типов урона без повторов.
 */
export function getSpellFilterDamageTypes(effect: SpellEffect): Array<string> {
  return [
    ...new Set([
      ...(effect.damageTypes ?? []),
      ...getSpellFormulaDamageTypes(effect),
    ]),
  ];
}

/**
 * Выбор автора в поле типов урона без типов из формул. Формульные типы поле
 * показывает всегда, и хранить их отдельно незачем: смени формулу — и тип,
 * который она больше не наносит, уйдёт из поля сам.
 *
 * @param effect воздействие заклинания.
 * @param selectedTypes типы, отмеченные в поле.
 * @returns типы, которые автор добавил сверх формул.
 */
export function getSpellManualDamageTypes(
  effect: SpellEffect,
  selectedTypes: Array<string>,
): Array<string> {
  const formulaTypes = new Set(getSpellFormulaDamageTypes(effect));

  return selectedTypes.filter((damageType) => !formulaTypes.has(damageType));
}

/**
 * Раскладывает части урона редактора обратно в параллельные массивы
 * SpellEffect одним обновлением — иначе формулы и цели разъезжаются по индексам.
 *
 * @param effect воздействие заклинания.
 * @param parts части урона из редактора.
 * @returns новое воздействие с обновлёнными формулами и целями.
 */
export function applySpellDamageFormulaParts(
  effect: SpellEffect,
  parts: DamageFormulaPart[],
): SpellEffect {
  return {
    ...effect,
    damageFormulas: parts.map((part) => part.formula),
    damageFormulaTargets: parts.map((part) => part.target),
    damageFormulaRequiresDamage: parts.map((part) => part.requiresDamage),
  };
}

/**
 * Возвращает цель, зашитую legacy-тегом в формулу урона.
 */
function getLegacySpellDamageFormulaTarget(
  formula: string,
): DamageFormulaTarget | undefined {
  return LEGACY_DAMAGE_TARGET_TAGS.find(({ tag }) => formula.includes(tag))
    ?.target;
}

/**
 * Мигрирует legacy-теги цели из формул урона в отдельное поле
 * `damageFormulaTargets` и выравнивает его по длине списка формул.
 */
function migrateSpellEffectDamageTargets(effect: SpellEffect): SpellEffect {
  const damageFormulas = effect.damageFormulas ?? [];
  const damageFormulaTargets = effect.damageFormulaTargets ?? [];
  const damageFormulaRequiresDamage = effect.damageFormulaRequiresDamage ?? [];

  return {
    ...effect,
    damageFormulas: damageFormulas.map((formula) =>
      formula.replace(LEGACY_DAMAGE_TARGET_TAG_PATTERN, '').trim(),
    ),
    damageFormulaTargets: damageFormulas.map(
      (formula, index) =>
        getLegacySpellDamageFormulaTarget(formula)
        ?? damageFormulaTargets[index]
        ?? DEFAULT_DAMAGE_FORMULA_TARGET,
    ),
    // Признаки выравниваются по формулам здесь же: у записей до появления поля
    // массива нет вовсе, а редактор читает его по индексам формул.
    damageFormulaRequiresDamage: damageFormulas.map(
      (_formula, index) => damageFormulaRequiresDamage[index] === true,
    ),
  };
}

/**
 * Мигрирует старые формулы урона SpellEffect к новому формату массивов формул.
 * Типы урона остаются на месте: теперь это поле фильтра каталога, и типы
 * legacy-записи ему как раз и соответствуют.
 */
function migrateSpellEffectDamageFormulas(effect: SpellEffect): SpellEffect {
  if (effect.damageFormulas && effect.damageFormulas.length > 0) {
    return {
      ...effect,
      damageFormula: undefined,
    };
  }

  if (!effect.damageFormula || !effect.damageTypes?.length) {
    return effect;
  }

  return {
    ...effect,
    damageFormulas: effect.damageTypes.map((damageType) =>
      createSpellDamageFormula(effect.damageFormula ?? '', damageType),
    ),
    damageFormula: undefined,
  };
}

/**
 * Нормализует заряды: ограничение без числа применений ничего не ограничивает,
 * поэтому такие заряды не пишутся. Исключение — «по желанию»: там максимум и не
 * нужен, заряды не расходуются.
 *
 * @param uses заряды из формы.
 * @returns заряды для сервера либо `undefined`.
 */
function normalizeSpellUses(
  uses: SpellUses | undefined,
): SpellUses | undefined {
  if (!uses) {
    return undefined;
  }

  if (uses.recovery === 'atWill') {
    return { max: undefined, recovery: 'atWill' };
  }

  return uses.max && uses.max > 0
    ? { max: uses.max, recovery: uses.recovery }
    : undefined;
}

/**
 * Нормализует усиление на высших кругах: пустые поля не пишутся, а усиление
 * без единого заполненного поля не пишется вовсе — иначе запись обещала бы
 * масштабирование, которого нет.
 *
 * @param scaling усиление из формы.
 * @returns усиление для сервера либо `undefined`.
 */
function normalizeSpellScaling(
  scaling: SpellScaling | undefined,
): SpellScaling | undefined {
  if (!scaling) {
    return undefined;
  }

  const additionalDice = scaling.additionalDice?.trim() || undefined;
  const description = scaling.description?.trim() || undefined;

  const additionalTargets =
    scaling.additionalTargets && scaling.additionalTargets > 0
      ? scaling.additionalTargets
      : undefined;

  if (!additionalDice && !description && additionalTargets === undefined) {
    return undefined;
  }

  return { additionalDice, additionalTargets, description };
}

/**
 * Нормализует тиры масштабирования заговора: тир без уровня или без единой
 * непустой формулы отбрасывается, остальные сортируются по уровню — потребитель
 * выбирает наибольший подходящий тир и на несортированном списке ошибётся.
 *
 * @param tiers тиры из формы.
 * @returns тиры для сервера либо `undefined`.
 */
function normalizeSpellCantripScalingTiers(
  tiers: SpellCantripScalingTier[] | undefined,
): SpellCantripScalingTier[] | undefined {
  if (!tiers?.length) {
    return undefined;
  }

  const normalized = tiers
    .map((tier) => ({
      level: tier.level,
      parts: tier.parts
        .map((part) => ({ ...part, formula: part.formula.trim() }))
        .filter((part) => part.formula),
    }))
    .filter(
      (tier) =>
        tier.level !== undefined && tier.level > 0 && tier.parts.length > 0,
    )
    .sort((tierA, tierB) => (tierA.level ?? 0) - (tierB.level ?? 0));

  return normalized.length > 0 ? normalized : undefined;
}

/** Воздействие заклинания, у которого цель — область с выбранной формой. */
type SpellEffectWithArea = SpellEffect & {
  areaOfEffect: SpellAreaOfEffect & { type: string };
};

/**
 * Есть ли у заклинания область: на её месте VTTG оставляет зону, в которую
 * уходят эффекты с доставкой «зоной на месте области».
 *
 * @param effect воздействие заклинания.
 * @returns `true`, если цель — область и её форма выбрана.
 */
export function hasSpellArea(
  effect: SpellEffect,
): effect is SpellEffectWithArea {
  return effect.targetType === 'AREA' && Boolean(effect.areaOfEffect?.type);
}

/**
 * Нормализует SpellEffect перед отправкой на сервер:
 * - Удаляет пустые массивы и незаполненные вложенные объекты.
 * - Очищает areaOfEffect, если targetType не AREA.
 * - Не возвращает пустой effect.
 * - Проверяет targetCount >= 1.
 * - Требует value1, если выбрана область.
 * - Показывает value2 только для LINE и CYLINDER.
 */
export function normalizeSpellEffect(
  effect: SpellEffect,
): SpellEffect | undefined {
  const migratedEffect = migrateSpellEffectDamageTargets(
    migrateSpellEffectHealingFormulas(migrateSpellEffectDamageFormulas(effect)),
  );

  const normalized: SpellEffect = {};

  if (migratedEffect.targetType) {
    normalized.targetType = migratedEffect.targetType;
  }

  // У снарядных заклинаний число целей определяют сами снаряды и режим
  // распределения — информационный targetCount не пишется.
  if (
    !migratedEffect.projectiles
    && migratedEffect.targetCount !== undefined
    && migratedEffect.targetCount >= 1
  ) {
    normalized.targetCount = migratedEffect.targetCount;
  }

  if (hasSpellArea(migratedEffect)) {
    const showValue2 =
      migratedEffect.areaOfEffect.type === 'LINE'
      || migratedEffect.areaOfEffect.type === 'CYLINDER';

    normalized.areaOfEffect = {
      type: migratedEffect.areaOfEffect.type,
      value1: migratedEffect.areaOfEffect.value1,
      value2: showValue2 ? migratedEffect.areaOfEffect.value2 : undefined,
    };
  }

  if (migratedEffect.attackType) {
    normalized.attackType = migratedEffect.attackType;
  }

  if (migratedEffect.autoHit) {
    normalized.autoHit = migratedEffect.autoHit;
  }

  if (migratedEffect.projectiles) {
    normalized.projectiles = normalizeSpellProjectiles(
      migratedEffect.projectiles,
    );
  }

  // Незаполненные части отбрасываются здесь, а не в форме: заклинание бывает и
  // вовсе без урона, и пустая часть в редакторе — нормальное состояние.
  const damageParts = getSpellDamageFormulaParts(migratedEffect)
    .map((part) => ({ ...part, formula: part.formula.trim() }))
    .filter((part) => part.formula);

  if (damageParts.length > 0) {
    normalized.damageFormulas = damageParts.map((part) => part.formula);

    // Цели пишутся, только если хоть одна часть уходит не в выбранную цель:
    // `selected` — дефолт VTTG, хранить его в справочнике незачем.
    const hasCustomTarget = damageParts.some(
      (part) => part.target !== DEFAULT_DAMAGE_FORMULA_TARGET,
    );

    if (hasCustomTarget) {
      normalized.damageFormulaTargets = damageParts.map((part) => part.target);
    }

    // Как и с целями: `false` — дефолт VTTG, хранить массив из одних нулей в
    // справочнике незачем.
    if (damageParts.some((part) => part.requiresDamage)) {
      normalized.damageFormulaRequiresDamage = damageParts.map(
        (part) => part.requiresDamage,
      );
    }
  }

  const damageTypes = getSpellFilterDamageTypes(migratedEffect);

  if (damageTypes.length > 0) {
    normalized.damageTypes = damageTypes;
  }

  if (migratedEffect.deliveryType) {
    normalized.deliveryType = migratedEffect.deliveryType;
  }

  // Ноль бонуса и его отсутствие равнозначны — хранить ноль незачем.
  if (migratedEffect.attackBonus) {
    normalized.attackBonus = migratedEffect.attackBonus;
  }

  const uses = normalizeSpellUses(migratedEffect.uses);

  if (uses) {
    normalized.uses = uses;
  }

  const scaling = normalizeSpellScaling(migratedEffect.scaling);

  if (scaling) {
    normalized.scaling = scaling;
  }

  const cantripScalingTiers = normalizeSpellCantripScalingTiers(
    migratedEffect.cantripScalingTiers,
  );

  if (cantripScalingTiers) {
    normalized.cantripScalingTiers = cantripScalingTiers;
  }

  if (migratedEffect.savingThrows && migratedEffect.savingThrows.length > 0) {
    normalized.savingThrows = migratedEffect.savingThrows;
  }

  if (migratedEffect.saveEffect) {
    normalized.saveEffect = migratedEffect.saveEffect;
  }

  if (migratedEffect.spellcastingAbility) {
    normalized.spellcastingAbility = migratedEffect.spellcastingAbility;
  }

  if (migratedEffect.conditions && migratedEffect.conditions.length > 0) {
    normalized.conditions = migratedEffect.conditions;
  }

  if (Object.keys(normalized).length === 0) {
    return undefined;
  }

  return normalized;
}

/**
 * Разбор заклинания, пришедшего с сервера.
 *
 * Данные приходят из `GET /api/v2/spells/{url}/raw`: воздействие лежит в JSONB,
 * и у записей разных лет набор его полей разный. Каждое поле разбирается
 * отдельно — битое значение становится пустым и не роняет соседние.
 */

/**
 * Схема значения из списка вариантов формы: чужое значение не поднимается.
 *
 * @param options варианты селекта с допустимыми значениями.
 * @returns схема, пропускающая только значения из списка.
 */
function createOptionValueSchema<Value extends string>(
  options: ReadonlyArray<{ value: Value }>,
): z.ZodCustom<Value, Value> {
  return z.custom<Value>((candidate) =>
    options.some((option) => option.value === candidate),
  );
}

/** Ключ характеристики: спасброски и заклинательная характеристика. */
const loadedAbilityKeySchema = z.enum(AbilityKey);

/** Область воздействия: у `effect` и у старого поля записи форма одна. */
const loadedSpellAreaOfEffectSchema = z
  .object({
    type: z.string().nullish().catch(null),
    value1: z.number().nullish().catch(null),
    value2: z.number().nullish().catch(null),
  })
  .nullish()
  .catch(null);

const loadedSpellProjectilesSchema = z
  .object({
    count: z.number().nullish().catch(null),
    perSlotLevel: z.number().nullish().catch(null),
    countByCharacterLevel: z
      .array(
        z
          .object({
            level: z.number().nullish().catch(null),
            count: z.number().nullish().catch(null),
          })
          .nullable()
          .catch(null),
      )
      .nullish()
      .catch(null),
    targetDistribution: z.enum(['single', 'distinct']).nullish().catch(null),
  })
  .nullish()
  .catch(null);

const loadedSpellUsesSchema = z
  .object({
    max: z.number().nullish().catch(null),
    recovery: createOptionValueSchema(SPELL_USES_RECOVERY_OPTIONS)
      .nullish()
      .catch(null),
  })
  .nullish()
  .catch(null);

const loadedSpellScalingSchema = z
  .object({
    additionalDice: z.string().nullish().catch(null),
    additionalTargets: z.number().nullish().catch(null),
    description: z.string().nullish().catch(null),
  })
  .nullish()
  .catch(null);

/** Тиры заговора; части урона внутри разбирает общая схема частей. */
const loadedSpellCantripScalingTiersSchema = z
  .array(
    z
      .object({
        level: z.number().nullish().catch(null),
        // Без optional ключ обязателен: тир без частей выпал бы целиком
        parts: z.unknown().optional(),
      })
      .nullable()
      .catch(null),
  )
  .nullish()
  .catch(null);

/**
 * Воздействие заклинания. Цели и признаки частей урона разбираются
 * поэлементно: чужое значение заменяется дефолтом, а не выбрасывается — иначе
 * они разъехались бы с формулами по индексам.
 */
const loadedSpellEffectSchema = z
  .object({
    targetType: createOptionValueSchema(SPELL_TARGET_TYPE_OPTIONS)
      .nullish()
      .catch(null),
    targetCount: z.number().nullish().catch(null),
    areaOfEffect: loadedSpellAreaOfEffectSchema,
    attackType: z.string().nullish().catch(null),
    deliveryType: createOptionValueSchema(SPELL_DELIVERY_TYPE_OPTIONS)
      .nullish()
      .catch(null),
    attackBonus: z.number().nullish().catch(null),
    autoHit: z.boolean().nullish().catch(null),
    projectiles: loadedSpellProjectilesSchema,
    uses: loadedSpellUsesSchema,
    scaling: loadedSpellScalingSchema,
    cantripScalingTiers: loadedSpellCantripScalingTiersSchema,
    damageFormulas: z.array(z.string()).nullish().catch(null),
    damageFormulaTargets: z
      .array(
        z
          .custom<DamageFormulaTarget>(isDamageFormulaTarget)
          .catch(DEFAULT_DAMAGE_FORMULA_TARGET),
      )
      .nullish()
      .catch(null),
    damageFormulaRequiresDamage: z
      .array(z.boolean().catch(false))
      .nullish()
      .catch(null),
    damageFormula: z.string().nullish().catch(null),
    damageTypes: z.array(z.string()).nullish().catch(null),
    healingTypes: z.array(z.string()).nullish().catch(null),
    savingThrows: z.array(loadedAbilityKeySchema).nullish().catch(null),
    saveEffect: createOptionValueSchema(SPELL_SAVE_EFFECT_OPTIONS)
      .nullish()
      .catch(null),
    conditions: z.array(z.string()).nullish().catch(null),
    spellcastingAbility: loadedAbilityKeySchema.nullish().catch(null),
  })
  .nullish()
  .catch(null);

type LoadedSpellEffect = NonNullable<z.infer<typeof loadedSpellEffectSchema>>;

/** Старые поля воздействия, лежавшие на самой записи до появления `effect`. */
const legacySpellFieldsSchema = z.object({
  savingThrow: z.array(loadedAbilityKeySchema).nullish().catch(null),
  healingType: z.array(z.string()).nullish().catch(null),
  damageType: z.array(z.string()).nullish().catch(null),
  damageFormula: z.string().nullish().catch(null),
  condition: z.array(z.string()).nullish().catch(null),
  attackType: z.string().nullish().catch(null),
  areaOfEffect: loadedSpellAreaOfEffectSchema,
});

/** Старые поля записи: после переноса в `effect` с записи снимаются. */
const LEGACY_SPELL_FIELD_KEYS: ReadonlySet<string> = new Set([
  'savingThrow',
  'healingType',
  'damageType',
  'damageFormula',
  'damageTypes',
  'condition',
  'attackType',
  'areaOfEffect',
]);

/**
 * Область воздействия для формы: ключи есть всегда — редактор пишет в них
 * через v-model.
 *
 * @param area разобранная область либо пустое значение.
 * @returns область с незаполненными полями вместо отсутствующих.
 */
function toSpellAreaOfEffect(
  area: LoadedSpellEffect['areaOfEffect'],
): SpellAreaOfEffect {
  return {
    type: area?.type ?? undefined,
    value1: area?.value1 ?? undefined,
    value2: area?.value2 ?? undefined,
  };
}

/**
 * Снарядный режим для формы. Гарантирует наличие массива порогов уровня для
 * v-model редактора.
 *
 * @param projectiles разобранный снарядный режим либо пустое значение.
 * @returns снарядный режим либо `undefined`, если его нет.
 */
function toSpellProjectiles(
  projectiles: LoadedSpellEffect['projectiles'],
): SpellProjectiles | undefined {
  if (!projectiles) {
    return undefined;
  }

  return {
    count: projectiles.count ?? 1,
    perSlotLevel: projectiles.perSlotLevel ?? undefined,
    countByCharacterLevel: (projectiles.countByCharacterLevel ?? [])
      .filter((tier) => tier !== null)
      .map((tier) => ({
        level: tier.level ?? undefined,
        count: tier.count ?? undefined,
      })),
    targetDistribution: projectiles.targetDistribution ?? undefined,
  };
}

/**
 * Заряды для формы: без способа восстановления — самый частый.
 *
 * @param uses разобранные заряды либо пустое значение.
 * @returns заряды либо `undefined`, если их нет.
 */
function toSpellUses(uses: LoadedSpellEffect['uses']): SpellUses | undefined {
  if (!uses) {
    return undefined;
  }

  return {
    max: uses.max ?? undefined,
    recovery: uses.recovery ?? DEFAULT_SPELL_USES_RECOVERY,
  };
}

/**
 * Усиление на высших кругах для формы.
 *
 * @param scaling разобранное усиление либо пустое значение.
 * @returns усиление либо `undefined`, если его нет.
 */
function toSpellScaling(
  scaling: LoadedSpellEffect['scaling'],
): SpellScaling | undefined {
  if (!scaling) {
    return undefined;
  }

  return {
    additionalDice: scaling.additionalDice ?? undefined,
    additionalTargets: scaling.additionalTargets ?? undefined,
    description: scaling.description ?? undefined,
  };
}

/**
 * Тиры масштабирования заговора для формы. У тира всегда есть хотя бы одна
 * часть — иначе форме нечего показать.
 *
 * @param tiers разобранные тиры либо пустое значение.
 * @returns тиры для формы.
 */
function toSpellCantripScalingTiers(
  tiers: LoadedSpellEffect['cantripScalingTiers'],
): SpellCantripScalingTier[] {
  return (tiers ?? [])
    .filter((tier) => tier !== null)
    .map((tier) => {
      const parts = parseLoadedDamageFormulaParts(tier.parts);

      return {
        level: tier.level ?? undefined,
        parts: parts.length > 0 ? parts : [createEmptyDamageFormulaPart()],
      };
    });
}

/**
 * Воздействие для формы: все поля на месте, списки — пустые вместо
 * отсутствующих, чтобы v-model не обращался к undefined.
 *
 * @param effect разобранное воздействие.
 * @returns воздействие для формы до миграций старых форматов.
 */
function toSpellEffect(effect: LoadedSpellEffect): SpellEffect {
  return {
    targetType: effect.targetType ?? undefined,
    targetCount: effect.targetCount ?? undefined,
    areaOfEffect: toSpellAreaOfEffect(effect.areaOfEffect),
    attackType: effect.attackType ?? undefined,
    deliveryType: effect.deliveryType ?? undefined,
    attackBonus: effect.attackBonus ?? undefined,
    autoHit: effect.autoHit ?? false,
    projectiles: toSpellProjectiles(effect.projectiles),
    uses: toSpellUses(effect.uses),
    scaling: toSpellScaling(effect.scaling),
    cantripScalingTiers: toSpellCantripScalingTiers(effect.cantripScalingTiers),
    damageFormulas: effect.damageFormulas ?? [],
    damageFormulaTargets: effect.damageFormulaTargets ?? [],
    damageFormulaRequiresDamage: effect.damageFormulaRequiresDamage ?? [],
    damageFormula: effect.damageFormula ?? undefined,
    damageTypes: effect.damageTypes ?? [],
    healingTypes: effect.healingTypes ?? [],
    savingThrows: effect.savingThrows ?? [],
    saveEffect: effect.saveEffect ?? undefined,
    conditions: effect.conditions ?? [],
    spellcastingAbility: effect.spellcastingAbility ?? undefined,
  };
}

/**
 * Формулы урона старой записи: одна формула размножалась по типам урона, а
 * у лечения стояла как есть.
 *
 * @param damageFormula старая единая формула.
 * @param damageTypes старые типы урона.
 * @param healingTypes старые типы лечения.
 * @returns формулы в нынешнем формате.
 */
function getLegacySpellDamageFormulas(
  damageFormula: string | undefined,
  damageTypes: string[],
  healingTypes: string[],
): string[] {
  if (damageFormula === undefined) {
    return [];
  }

  if (damageTypes.length > 0) {
    return damageTypes.map((damageType) =>
      createSpellDamageFormula(damageFormula, damageType),
    );
  }

  return healingTypes.length > 0 ? [damageFormula] : [];
}

/**
 * Собирает воздействие старой записи без `effect` из полей верхнего уровня.
 *
 * @param loadedSpell запись с сервера.
 * @returns воздействие для формы.
 */
function migrateLegacySpellFields(
  loadedSpell: Record<string, unknown>,
): SpellEffect {
  const legacyFields = legacySpellFieldsSchema.parse(loadedSpell);
  const damageTypes = legacyFields.damageType ?? [];
  const healingTypes = legacyFields.healingType ?? [];

  return migrateSpellEffectHealingFormulas({
    ...createEmptySpellEffect(),
    savingThrows: legacyFields.savingThrow ?? [],
    healingTypes,
    damageTypes,
    damageFormulas: getLegacySpellDamageFormulas(
      legacyFields.damageFormula ?? undefined,
      damageTypes,
      healingTypes,
    ),
    conditions: legacyFields.condition ?? [],
    attackType: legacyFields.attackType ?? undefined,
    areaOfEffect: toSpellAreaOfEffect(legacyFields.areaOfEffect),
  });
}

/**
 * Нормализует загруженное с сервера заклинание:
 * - Поддерживает старые записи без effect (мигрирует отдельные поля).
 * - Обеспечивает наличие всех вложенных массивов и areaOfEffect.
 *
 * @param loadedSpell запись из ответа `/raw`.
 * @returns запись для формы.
 */
export function normalizeLoadedSpell(
  loadedSpell: Record<string, unknown>,
): Record<string, unknown> {
  const loadedEffect = loadedSpellEffectSchema.parse(loadedSpell.effect);
  const activeEffects = normalizeLoadedActiveEffects(loadedSpell.activeEffects);

  if (loadedEffect) {
    return {
      ...loadedSpell,
      effect: migrateSpellEffectDamageTargets(
        migrateSpellEffectHealingFormulas(
          migrateSpellEffectDamageFormulas(toSpellEffect(loadedEffect)),
        ),
      ),
      activeEffects,
    };
  }

  const currentFields = Object.entries(loadedSpell).filter(
    ([fieldName]) => !LEGACY_SPELL_FIELD_KEYS.has(fieldName),
  );

  return {
    ...Object.fromEntries(currentFields),
    effect: migrateLegacySpellFields(loadedSpell),
    activeEffects,
  };
}
