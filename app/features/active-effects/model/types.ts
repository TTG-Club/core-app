/**
 * Модель «Активных эффектов», совместимая с системой Active Effects приложения
 * VTTG (Virtual TTG Club). Одна и та же у всего, что меняет числа на листе
 * персонажа: заклинаний и магических предметов.
 *
 * Структура повторяет `ActiveEffect` из `@vtt/shared` один-в-один, чтобы экспорт
 * в VTTG был pass-through без преобразования словарей: характеристики хранятся
 * полными именами (`strength`…`charisma`), ключи состояний/режимов/флагов — в
 * тех же строковых значениях, что и в VTTG.
 *
 * Зеркало: vttg/packages/shared/src/system/dnd/activeEffectTypes.ts
 */

import { z } from 'zod';

/** Характеристика D&D 5e (полное имя — словарь VTTG). */
export type EffectAbility =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

/** Режим применения числового изменения (change). */
export type EffectChangeMode =
  | 'add'
  | 'multiply'
  | 'override'
  | 'upgrade'
  | 'downgrade'
  | 'custom';

/** Источник эффекта: чем он выдан — заклинанием, предметом, особенностью. */
export type EffectOrigin =
  | 'item'
  | 'spell'
  | 'feature'
  | 'condition'
  | 'manual'
  | 'area';

/** Тип длительности эффекта. */
export type EffectDurationType =
  | 'permanent'
  | 'rounds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'turn'
  | 'special';

/** Чей ход прекращает точную длительность `turn`. */
export type EffectTurnAnchor = 'carrier' | 'source';

/** Момент хода якоря, в который истекает точная длительность `turn`. */
export type EffectTurnTiming = 'start' | 'end';

/**
 * Триггер «сгорания» одноразового эффекта на броске атаки.
 *
 * - `carrierAttack` — снять, когда НОСИТЕЛЬ совершает бросок атаки (помеха
 *   ровно на одну следующую атаку: Злая насмешка, Луч слабости);
 * - `attackOnCarrier` — снять, когда по НОСИТЕЛЮ совершают бросок атаки
 *   (преимущество следующей атаки по цели: Направляющий снаряд).
 */
export type EffectAttackTrigger = 'carrierAttack' | 'attackOnCarrier';

/** Ключ состояния D&D 5e (PHB 2024). */
export type EffectConditionKey =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

/** Куда применяется эффект. */
export type EffectTarget = 'self' | 'target';

/** Кого задевает аура. */
export type EffectAuraTarget = 'allies' | 'enemies' | 'all';

/** Триггер срабатывания эффекта области/ауры. */
export type EffectAreaTrigger = 'stay' | 'enter' | 'exit';

/** Что делает успешный спасбросок при наложении эффекта. */
export type EffectSaveOutcome = 'negate' | 'half';

/** Момент периодического спасброска/урона. */
export type EffectSaveTiming = 'startOfTurn' | 'endOfTurn';

/**
 * Цель части урона/лечения внутри эффекта.
 * `selected` — выбранная цель, `self` — носитель, `choose` — отдельная цель.
 */
export type EffectDamagePartTarget = 'selected' | 'self' | 'choose';

/** Одна часть урона/лечения эффекта (подмножество DamagePart из VTTG). */
export interface EffectDamagePart {
  /** Формула (напр. "2к8@dmg.poison", "1к4@heal"). */
  formula: string;
  /** Тип урона (для лечения не используется). */
  type?: string;
  /** Цель части (по умолчанию `selected`). */
  target?: EffectDamagePartTarget;
  /** Применять часть только если по носителю нанесён урон (>0). */
  requiresDamage?: boolean;
}

/** Одно числовое изменение, вносимое эффектом. */
export interface EffectChange {
  /** Какой параметр модифицировать (напр. "armorClass", "ability.strength"). */
  key: string;
  /** Как модифицировать. */
  mode: EffectChangeMode;
  /** Числовое значение или формула с @-переменными. */
  value: string;
  /** Опциональное условие (напр. "roll.hasAdvantage === true"). */
  condition?: string;
  /** Приоритет применения (меньше = раньше, по умолчанию 20). */
  priority: number;
}

/** Длительность эффекта. */
export interface EffectDuration {
  type: EffectDurationType;
  /** Начальное количество единиц (для rounds/minutes/hours/days). */
  value?: number;
  /** Оставшееся количество (для rounds, декрементируется в VTTG). */
  remaining?: number;
  /** Чей ход прекращает эффект при `type: 'turn'` (по умолчанию `carrier`). */
  turnAnchor?: EffectTurnAnchor;
  /** Момент хода якоря при `type: 'turn'` (по умолчанию `end`). */
  turnTiming?: EffectTurnTiming;
}

/** Настройки ауры эффекта. */
export interface EffectAura {
  /** Радиус в футах. */
  radius: number;
  /** Кого задевает аура. */
  target: EffectAuraTarget;
  /** Применяется ли эффект к создателю ауры. */
  applyToSelf: boolean;
  /** Отображать ли радиус ауры на сцене. */
  visible?: boolean;
}

/** Спасбросок при наложении эффекта (в момент попадания атакой/областью). */
export interface EffectSave {
  ability: EffectAbility;
  dc: number;
  onSuccess: EffectSaveOutcome;
}

/** Периодический спасбросок для снятия эффекта. */
export interface EffectRecurringSave {
  ability: EffectAbility;
  /** Сложность (`0` = подставить Сл кастера при наложении в VTTG). */
  dc: number;
  timing: EffectSaveTiming;
}

/** Периодический урон (DoT): наносится каждый ход, пока эффект активен. */
export interface EffectRecurringDamage {
  damageParts: EffectDamagePart[];
  timing: EffectSaveTiming;
}

/** Активный эффект — полная структура VTTG `ActiveEffect`. */
export interface ActiveEffect {
  /** Уникальный идентификатор эффекта. */
  id: string;
  /** Название эффекта. */
  name: string;
  /** Описание эффекта. */
  description: string;
  /** Путь к иконке (формат tabler:icon-name). */
  icon?: string;
  /** Отключён ли эффект (временно деактивирован, но не удалён). */
  disabled: boolean;
  /** Источник эффекта. */
  origin: EffectOrigin;
  /** ID объекта-источника. */
  originId?: string;
  /** Переносится ли эффект с предмета на актора при экипировке. */
  transfer: boolean;
  /** Длительность эффекта. */
  duration: EffectDuration;
  /** Числовые модификаторы. */
  changes: EffectChange[];
  /** Булевы флаги (помеха, преимущество, иммунитеты и т.д.). */
  flags: string[];
  /** Настройки ауры (если эффект транслируется на других). */
  aura?: EffectAura;
  /** Триггер для эффектов области/ауры. */
  areaTrigger?: EffectAreaTrigger;
  /** Цель применения эффекта (`self` по умолчанию). */
  effectTarget?: EffectTarget;
  /** Ключ стандартного состояния D&D 5e, если эффект его представляет. */
  conditionKey?: EffectConditionKey;
  /** Спасбросок при наложении. */
  applySave?: EffectSave;
  /** Накладывать эффект-состояние даже при успешном спасброске. */
  applyOnSuccess?: boolean;
  /**
   * Накладывать эффект ТОЛЬКО при успешном спасброске и не накладывать при
   * провале — зеркало `applyOnSuccess`. Нужно заклинаниям с разными исходами
   * «успех/провал» (Луч слабости).
   */
  applyOnSuccessOnly?: boolean;
  /**
   * Одноразовость на броске атаки: эффект «сгорает» после первого подходящего
   * броска, не дожидаясь конца длительности. Не задан — эффект живёт по
   * обычной длительности.
   */
  consumeOn?: EffectAttackTrigger;
  /** Урон при наложении эффекта. */
  damageParts?: EffectDamagePart[];
  /** Периодический спасбросок для снятия эффекта. */
  recurringSave?: EffectRecurringSave;
  /** Периодический урон (DoT). */
  recurringDamage?: EffectRecurringDamage;
  /**
   * Состояния, к которым эффект даёт иммунитет носителю (напр. Окаменевший
   * даёт иммунитет к Отравлению).
   */
  conditionImmunities?: EffectConditionKey[];
}

/** Приоритет по умолчанию для нового изменения. */
export const DEFAULT_EFFECT_CHANGE_PRIORITY = 20;

/** Иконка эффекта по умолчанию. */
export const DEFAULT_EFFECT_ICON = 'tabler:sparkles';

/** Генерирует уникальный id эффекта. */
function generateEffectId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `effect-${crypto.randomUUID()}`;
  }

  return `effect-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Создаёт пустой активный эффект с дефолтами VTTG.
 *
 * @param origin чем эффект выдан; по умолчанию заклинанием.
 * @returns новый эффект.
 */
export function createEmptyActiveEffect(
  origin: EffectOrigin = 'spell',
): ActiveEffect {
  return {
    id: generateEffectId(),
    name: 'Новый эффект',
    description: '',
    icon: DEFAULT_EFFECT_ICON,
    disabled: false,
    origin,
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags: [],
    effectTarget: 'self',
  };
}

/** Ключ нового изменения по умолчанию: класс доспеха меняют чаще всего. */
export const DEFAULT_EFFECT_CHANGE_KEY = 'armorClass';

/** Значение нового изменения по умолчанию. */
export const DEFAULT_EFFECT_CHANGE_VALUE = '1';

/** Создаёт пустое числовое изменение. */
export function createEmptyEffectChange(): EffectChange {
  return {
    key: DEFAULT_EFFECT_CHANGE_KEY,
    mode: 'add',
    value: DEFAULT_EFFECT_CHANGE_VALUE,
    condition: '',
    priority: DEFAULT_EFFECT_CHANGE_PRIORITY,
  };
}

/** Создаёт пустую часть урона эффекта. */
export function createEmptyEffectDamagePart(): EffectDamagePart {
  return {
    formula: '',
    target: 'selected',
  };
}

/** Флаг по умолчанию для нового элемента списка флагов. */
export const DEFAULT_EFFECT_FLAG = 'vision.blinded';

/** Дефолтный спасбросок при включении соответствующих блоков эффекта. */
export const DEFAULT_EFFECT_SAVE: EffectSave = {
  ability: 'wisdom',
  dc: 13,
  onSuccess: 'negate',
};

/** Дефолтные параметры ауры при её включении. */
export const DEFAULT_EFFECT_AURA: EffectAura = {
  radius: 10,
  target: 'allies',
  applyToSelf: true,
  visible: true,
};

/** Нормализует часть урона эффекта: trim формулы, сброс пустых полей. */
function normalizeEffectDamagePart(part: EffectDamagePart): EffectDamagePart {
  return {
    // Тип урона живёт токеном `@dmg.*` в самой формуле (`migrateEffectDamagePart`
    // переносит туда легаси-поле при загрузке), поэтому наружу оно не уходит:
    // два источника типа рано или поздно разошлись бы.
    formula: part.formula.trim(),
    type: undefined,
    target: part.target ?? 'selected',
    requiresDamage: part.requiresDamage || undefined,
  };
}

/** Отбрасывает части без формулы и нормализует оставшиеся. */
function normalizeEffectDamageParts(
  parts: EffectDamagePart[] | undefined,
): EffectDamagePart[] | undefined {
  if (!parts?.length) {
    return undefined;
  }

  const cleaned = parts
    .filter((part) => part.formula.trim().length > 0)
    .map(normalizeEffectDamagePart);

  return cleaned.length > 0 ? cleaned : undefined;
}

/** Нормализует одно изменение: trim ключа/значения, пустое условие → undefined. */
function normalizeEffectChange(change: EffectChange): EffectChange {
  const condition = change.condition?.trim();

  return {
    key: change.key.trim(),
    mode: change.mode,
    value: change.value.trim(),
    condition: condition || undefined,
    priority: change.priority,
  };
}

/**
 * Нормализует длительность: якорь и момент хода осмысленны только у точной
 * «ходовой» длительности, а у остальных типов они молча сбивали бы с толку —
 * поле в форме скрыто, а значение от прошлого выбора осталось бы в записи.
 *
 * @param duration длительность эффекта.
 * @returns длительность без лишних полей.
 */
function normalizeEffectDuration(duration: EffectDuration): EffectDuration {
  if (duration.type !== 'turn') {
    return {
      type: duration.type,
      value: duration.value,
      remaining: duration.remaining,
    };
  }

  return {
    type: duration.type,
    turnAnchor: duration.turnAnchor ?? 'carrier',
    turnTiming: duration.turnTiming ?? 'end',
  };
}

/**
 * Нормализует один активный эффект перед отправкой на сервер:
 * - убирает пустые изменения (без ключа или значения) и пустые флаги;
 * - очищает части урона без формулы;
 * - сбрасывает `aura`/`effectTarget` во взаимоисключающих режимах;
 * - оставляет ровно один из взаимоисключающих исходов спасброска.
 */
function normalizeActiveEffect(effect: ActiveEffect): ActiveEffect {
  const changes = effect.changes
    .map(normalizeEffectChange)
    .filter((change) => change.key.length > 0 && change.value.length > 0);

  const flags = effect.flags
    .map((flag) => flag.trim())
    .filter((flag) => flag.length > 0);

  const damageParts = normalizeEffectDamageParts(effect.damageParts);

  const recurringDamage = effect.recurringDamage
    ? {
        timing: effect.recurringDamage.timing,
        damageParts:
          normalizeEffectDamageParts(effect.recurringDamage.damageParts) ?? [],
      }
    : undefined;

  // Аура и эффект на цель — взаимоисключающие режимы.
  const aura = effect.effectTarget === 'target' ? undefined : effect.aura;

  // «Даже при успехе» и «только при успехе» вместе не читаются: движок всё
  // равно выбрал бы одно, поэтому наружу уходит ровно один исход.
  const applyOnSuccess = effect.applyOnSuccess === true ? true : undefined;

  const applyOnSuccessOnly =
    !applyOnSuccess && effect.applyOnSuccessOnly === true ? true : undefined;

  return {
    ...effect,
    name: effect.name.trim(),
    description: effect.description.trim(),
    icon: effect.icon?.trim() || undefined,
    duration: normalizeEffectDuration(effect.duration),
    changes,
    flags,
    aura,
    applyOnSuccess,
    applyOnSuccessOnly,
    damageParts,
    recurringDamage,
    conditionImmunities: effect.conditionImmunities?.length
      ? effect.conditionImmunities
      : undefined,
  };
}

/**
 * Нормализует массив активных эффектов перед сохранением.
 * Отбрасывает эффекты без названия.
 */
export function normalizeActiveEffects(
  effects: ActiveEffect[] | undefined,
): ActiveEffect[] {
  if (!effects?.length) {
    return [];
  }

  return effects
    .map(normalizeActiveEffect)
    .filter((effect) => effect.name.length > 0);
}

// ── Zod-схемы для валидации загруженных с сервера данных ──────────
// Внешние данные считаем `unknown` и валидируем через Zod (см. AGENTS.md),
// без приведений типов. Закрытые наборы значений описаны через `z.enum`,
// открытые (флаги, ключи изменений, типы урона) — как строки.

const durationSchema: z.ZodType<EffectDuration> = z.object({
  type: z.enum([
    'permanent',
    'rounds',
    'minutes',
    'hours',
    'days',
    'turn',
    'special',
  ]),
  value: z.number().optional(),
  remaining: z.number().optional(),
  turnAnchor: z.enum(['carrier', 'source']).optional(),
  turnTiming: z.enum(['start', 'end']).optional(),
});

const changeSchema: z.ZodType<EffectChange> = z.object({
  key: z.string(),
  mode: z.enum([
    'add',
    'multiply',
    'override',
    'upgrade',
    'downgrade',
    'custom',
  ]),
  value: z.string(),
  condition: z.string().optional(),
  priority: z.number(),
});

const damagePartSchema: z.ZodType<EffectDamagePart> = z.object({
  formula: z.string(),
  type: z.string().optional(),
  target: z.enum(['selected', 'self', 'choose']).optional(),
  requiresDamage: z.boolean().optional(),
});

const auraSchema: z.ZodType<EffectAura> = z.object({
  radius: z.number(),
  target: z.enum(['allies', 'enemies', 'all']),
  applyToSelf: z.boolean(),
  visible: z.boolean().optional(),
});

const abilitySchema = z.enum([
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]);

const saveSchema: z.ZodType<EffectSave> = z.object({
  ability: abilitySchema,
  dc: z.number(),
  onSuccess: z.enum(['negate', 'half']),
});

const recurringSaveSchema: z.ZodType<EffectRecurringSave> = z.object({
  ability: abilitySchema,
  dc: z.number(),
  timing: z.enum(['startOfTurn', 'endOfTurn']),
});

const recurringDamageSchema: z.ZodType<EffectRecurringDamage> = z.object({
  damageParts: z.array(damagePartSchema),
  timing: z.enum(['startOfTurn', 'endOfTurn']),
});

const conditionKeySchema = z.enum([
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
]);

const activeEffectSchema: z.ZodType<ActiveEffect> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  disabled: z.boolean(),
  origin: z.enum(['item', 'spell', 'feature', 'condition', 'manual', 'area']),
  originId: z.string().optional(),
  transfer: z.boolean(),
  duration: durationSchema,
  changes: z.array(changeSchema),
  flags: z.array(z.string()),
  aura: auraSchema.optional(),
  areaTrigger: z.enum(['stay', 'enter', 'exit']).optional(),
  effectTarget: z.enum(['self', 'target']).optional(),
  conditionKey: conditionKeySchema.optional(),
  applySave: saveSchema.optional(),
  applyOnSuccess: z.boolean().optional(),
  applyOnSuccessOnly: z.boolean().optional(),
  consumeOn: z.enum(['carrierAttack', 'attackOnCarrier']).optional(),
  damageParts: z.array(damagePartSchema).optional(),
  recurringSave: recurringSaveSchema.optional(),
  recurringDamage: recurringDamageSchema.optional(),
  conditionImmunities: z.array(conditionKeySchema).optional(),
});

/**
 * Переносит легаси-поле `type` части урона в токен формулы.
 *
 * Тип урона задаётся токеном `@dmg.<тип>`, а прежний редактор писал его
 * отдельным полем. Без переноса такая часть в форме выглядела бы «без типа»:
 * вкладки правят формулу, а поля `type` в них нет.
 *
 * @param part часть урона, как её отдал сервер.
 * @returns часть, у которой тип живёт в формуле.
 */
function migrateEffectDamagePart(part: EffectDamagePart): EffectDamagePart {
  const formula = part.formula;
  const hasTypeToken = formula.includes('@dmg.') || formula.includes('@heal');

  if (!part.type || hasTypeToken) {
    return { ...part, type: undefined };
  }

  return { ...part, formula: `${formula}@dmg.${part.type}`, type: undefined };
}

/**
 * Переносит легаси-типы урона во всех частях эффекта: при наложении и в
 * периодическом уроне.
 *
 * @param effect загруженный эффект.
 * @returns эффект с типами урона в формулах.
 */
function migrateLoadedActiveEffect(effect: ActiveEffect): ActiveEffect {
  return {
    ...effect,
    damageParts: effect.damageParts?.map(migrateEffectDamagePart),
    recurringDamage: effect.recurringDamage
      ? {
          ...effect.recurringDamage,
          damageParts: effect.recurringDamage.damageParts.map(
            migrateEffectDamagePart,
          ),
        }
      : undefined,
  };
}

/**
 * Нормализует массив активных эффектов, загруженный с сервера.
 * Валидирует каждый эффект Zod-схемой и отбрасывает некорректные,
 * чтобы одна битая запись не обнулила весь список.
 */
export function normalizeLoadedActiveEffects(raw: unknown): ActiveEffect[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const effects: ActiveEffect[] = [];

  for (const item of raw) {
    const parsed = activeEffectSchema.safeParse(item);

    if (parsed.success) {
      effects.push(migrateLoadedActiveEffect(parsed.data));
    }
  }

  return effects;
}
