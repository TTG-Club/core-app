import type { AbilityKey } from '~/shared/types';
import type { EditorBaseInfoState } from '~ui/editor';

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
    damageFormula: undefined,
    damageTypes: [],
    healingTypes: [],
    savingThrows: [],
    saveEffect: undefined,
    conditions: [],
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
  const normalized: SpellEffect = {};

  if (effect.targetType) {
    normalized.targetType = effect.targetType;
  }

  if (effect.targetCount !== undefined && effect.targetCount >= 1) {
    normalized.targetCount = effect.targetCount;
  }

  if (effect.targetType === 'AREA' && effect.areaOfEffect?.type) {
    const showValue2 =
      effect.areaOfEffect.type === 'LINE'
      || effect.areaOfEffect.type === 'CYLINDER';

    normalized.areaOfEffect = {
      type: effect.areaOfEffect.type,
      value1: effect.areaOfEffect.value1,
      value2: showValue2 ? effect.areaOfEffect.value2 : undefined,
    };
  }

  if (effect.attackType) {
    normalized.attackType = effect.attackType;
  }

  if (effect.autoHit) {
    normalized.autoHit = effect.autoHit;
  }

  if (effect.damageFormula) {
    normalized.damageFormula = effect.damageFormula;
  }

  if (effect.damageTypes && effect.damageTypes.length > 0) {
    normalized.damageTypes = effect.damageTypes;
  }

  if (effect.healingTypes && effect.healingTypes.length > 0) {
    normalized.healingTypes = effect.healingTypes;
  }

  if (effect.savingThrows && effect.savingThrows.length > 0) {
    normalized.savingThrows = effect.savingThrows;
  }

  if (effect.saveEffect) {
    normalized.saveEffect = effect.saveEffect;
  }

  if (effect.conditions && effect.conditions.length > 0) {
    normalized.conditions = effect.conditions;
  }

  if (Object.keys(normalized).length === 0) {
    return undefined;
  }

  return normalized;
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

  if (result.effect && typeof result.effect === 'object') {
    const rawEffect = result.effect as Record<string, unknown>;

    result.effect = {
      ...createEmptySpellEffect(),
      ...rawEffect,
      areaOfEffect:
        rawEffect.areaOfEffect && typeof rawEffect.areaOfEffect === 'object'
          ? {
              type: undefined,
              value1: undefined,
              value2: undefined,
              ...(rawEffect.areaOfEffect as Record<string, unknown>),
            }
          : createEmptySpellEffect().areaOfEffect,
    };
  } else {
    // Миграция старых записей без effect
    const migratedEffect = createEmptySpellEffect();

    if (Array.isArray(result.savingThrow)) {
      migratedEffect.savingThrows = result.savingThrow as AbilityKey[];
    }

    if (Array.isArray(result.healingType)) {
      migratedEffect.healingTypes = result.healingType as string[];
    }

    if (Array.isArray(result.damageType)) {
      migratedEffect.damageTypes = result.damageType as string[];
    }

    if (Array.isArray(result.condition)) {
      migratedEffect.conditions = result.condition as string[];
    }

    if (typeof result.attackType === 'string') {
      migratedEffect.attackType = result.attackType as string;
    }

    if (result.areaOfEffect && typeof result.areaOfEffect === 'object') {
      const oldArea = result.areaOfEffect as Record<string, unknown>;

      migratedEffect.areaOfEffect = {
        type: typeof oldArea.type === 'string' ? oldArea.type : undefined,
        value1: typeof oldArea.value1 === 'number' ? oldArea.value1 : undefined,
        value2: typeof oldArea.value2 === 'number' ? oldArea.value2 : undefined,
      };
    }

    result.effect = migratedEffect;

    // Удаляем старые поля
    delete result.savingThrow;
    delete result.healingType;
    delete result.damageType;
    delete result.condition;
    delete result.attackType;
    delete result.areaOfEffect;
  }

  return result;
}
