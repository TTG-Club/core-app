import type { AbilityKey } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

import { SPELL_DAMAGE_TYPE_TAGS, SPELL_HEALING_TYPE_TAGS } from './constants';

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
 * Единый объект воздействия заклинания.
 * Объединяет damageType, savingThrow, areaOfEffect, attackType и другие поля.
 */
export interface SpellEffect {
  targetType?: SpellTargetType;
  targetCount?: number;
  areaOfEffect?: SpellAreaOfEffect;
  attackType?: string;
  autoHit?: boolean;
  damageFormulas?: string[];
  damageFormula?: string;
  damageTypes?: string[];
  healingTypes?: string[];
  savingThrows?: AbilityKey[];
  saveEffect?: SpellSaveEffect;
  conditions?: string[];
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
    autoHit: false,
    damageFormulas: [],
    damageFormula: undefined,
    damageTypes: [],
    healingTypes: [],
    savingThrows: [],
    saveEffect: undefined,
    conditions: [],
  };
}

/**
 * Возвращает тег типа урона заклинания.
 */
function getSpellDamageTypeTag(damageType: string): string {
  return SPELL_DAMAGE_TYPE_TAGS[damageType] ?? damageType;
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
 * Мигрирует старые формулы урона SpellEffect к новому формату массивов формул.
 */
function migrateSpellEffectDamageFormulas(effect: SpellEffect): SpellEffect {
  if (effect.damageFormulas && effect.damageFormulas.length > 0) {
    return {
      ...effect,
      damageFormula: undefined,
      damageTypes: [],
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
    damageTypes: [],
  };
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
  const migratedEffect = migrateSpellEffectHealingFormulas(
    migrateSpellEffectDamageFormulas(effect),
  );

  const normalized: SpellEffect = {};

  if (migratedEffect.targetType) {
    normalized.targetType = migratedEffect.targetType;
  }

  if (
    migratedEffect.targetCount !== undefined
    && migratedEffect.targetCount >= 1
  ) {
    normalized.targetCount = migratedEffect.targetCount;
  }

  if (
    migratedEffect.targetType === 'AREA'
    && migratedEffect.areaOfEffect?.type
  ) {
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

  if (
    migratedEffect.damageFormulas
    && migratedEffect.damageFormulas.length > 0
  ) {
    normalized.damageFormulas = migratedEffect.damageFormulas;
  }

  if (migratedEffect.savingThrows && migratedEffect.savingThrows.length > 0) {
    normalized.savingThrows = migratedEffect.savingThrows;
  }

  if (migratedEffect.saveEffect) {
    normalized.saveEffect = migratedEffect.saveEffect;
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
 * Проверяет, является ли значение объектом (Record<string, unknown>).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Проверяет, является ли значение массивом строк.
 */
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

/**
 * Проверяет, является ли значение корректным ключом характеристики (AbilityKey).
 */
function isAbilityKey(value: unknown): value is AbilityKey {
  return (
    typeof value === 'string'
    && ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(value)
  );
}

/**
 * Проверяет, является ли значение массивом ключей характеристик (AbilityKey[]).
 */
function isAbilityKeyArray(value: unknown): value is AbilityKey[] {
  return Array.isArray(value) && value.every(isAbilityKey);
}

/**
 * Нормализует загруженный с сервера raw-объект заклинания:
 * - Поддерживает старые записи без effect (мигрирует отдельные поля).
 * - Обеспечивает наличие всех вложенных массивов и areaOfEffect.
 */
export function normalizeLoadedSpell(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...raw };

  if (result.effect && isRecord(result.effect)) {
    const rawEffect = result.effect;

    result.effect = migrateSpellEffectHealingFormulas(
      migrateSpellEffectDamageFormulas({
        ...createEmptySpellEffect(),
        ...rawEffect,
        areaOfEffect:
          rawEffect.areaOfEffect && isRecord(rawEffect.areaOfEffect)
            ? {
                type: undefined,
                value1: undefined,
                value2: undefined,
                ...rawEffect.areaOfEffect,
              }
            : createEmptySpellEffect().areaOfEffect,
      }),
    );
  } else {
    // Миграция старых записей без effect
    const migratedEffect = createEmptySpellEffect();

    if (isAbilityKeyArray(result.savingThrow)) {
      migratedEffect.savingThrows = result.savingThrow;
    }

    if (isStringArray(result.healingType)) {
      migratedEffect.healingTypes = result.healingType;
    }

    if (isStringArray(result.damageType)) {
      migratedEffect.damageTypes = result.damageType;
    }

    if (
      typeof result.damageFormula === 'string'
      && migratedEffect.damageTypes
      && migratedEffect.damageTypes.length > 0
    ) {
      const damageFormula = result.damageFormula;

      migratedEffect.damageFormulas = migratedEffect.damageTypes.map(
        (damageType) => createSpellDamageFormula(damageFormula, damageType),
      );

      migratedEffect.damageFormula = undefined;
      migratedEffect.damageTypes = [];
    } else if (
      typeof result.damageFormula === 'string'
      && migratedEffect.healingTypes
      && migratedEffect.healingTypes.length > 0
    ) {
      migratedEffect.damageFormulas = [result.damageFormula];
      migratedEffect.damageFormula = undefined;
    }

    if (isStringArray(result.condition)) {
      migratedEffect.conditions = result.condition;
    }

    if (typeof result.attackType === 'string') {
      migratedEffect.attackType = result.attackType;
    }

    if (result.areaOfEffect && isRecord(result.areaOfEffect)) {
      const oldArea = result.areaOfEffect;

      migratedEffect.areaOfEffect = {
        type: typeof oldArea.type === 'string' ? oldArea.type : undefined,
        value1: typeof oldArea.value1 === 'number' ? oldArea.value1 : undefined,
        value2: typeof oldArea.value2 === 'number' ? oldArea.value2 : undefined,
      };
    }

    result.effect = migrateSpellEffectHealingFormulas(migratedEffect);

    // Удаляем старые поля
    delete result.savingThrow;
    delete result.healingType;
    delete result.damageType;
    delete result.damageFormula;
    delete result.damageTypes;
    delete result.condition;
    delete result.attackType;
    delete result.areaOfEffect;
  }

  return result;
}
