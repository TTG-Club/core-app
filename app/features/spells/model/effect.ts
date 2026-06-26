/**
 * Модель «Активных эффектов» заклинания, совместимая с системой Active Effects
 * приложения VTTG (Virtual TTG Club). Структура повторяет `ActiveEffect` из
 * `@vtt/shared` один-в-один, чтобы экспорт заклинаний в VTTG был
 * pass-through без преобразования словарей: характеристики хранятся полными
 * именами (`strength`…`charisma`), ключи состояний/режимов/флагов — в тех же
 * строковых значениях, что и в VTTG.
 *
 * Зеркало: vttg/packages/shared/src/system/dnd/activeEffectTypes.ts
 */

import { z } from 'zod';

/** Характеристика D&D 5e (полное имя — словарь VTTG). */
export type SpellEffectAbility =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

/** Режим применения числового изменения (change). */
export type SpellEffectChangeMode =
  | 'add'
  | 'multiply'
  | 'override'
  | 'upgrade'
  | 'downgrade'
  | 'custom';

/** Источник эффекта. Для эффектов заклинания всегда `spell`. */
export type SpellEffectOrigin =
  | 'item'
  | 'spell'
  | 'feature'
  | 'condition'
  | 'manual'
  | 'area';

/** Тип длительности эффекта. */
export type SpellEffectDurationType =
  | 'permanent'
  | 'rounds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'special';

/** Ключ состояния D&D 5e (PHB 2024). */
export type SpellEffectConditionKey =
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
export type SpellEffectTarget = 'self' | 'target';

/** Кого задевает аура. */
export type SpellEffectAuraTarget = 'allies' | 'enemies' | 'all';

/** Триггер срабатывания эффекта области/ауры. */
export type SpellEffectAreaTrigger = 'stay' | 'enter' | 'exit';

/** Что делает успешный спасбросок при наложении эффекта. */
export type SpellEffectSaveOutcome = 'negate' | 'half';

/** Момент периодического спасброска/урона. */
export type SpellEffectSaveTiming = 'startOfTurn' | 'endOfTurn';

/**
 * Цель части урона/лечения внутри эффекта.
 * `selected` — выбранная цель, `self` — носитель, `choose` — отдельная цель.
 */
export type SpellEffectDamagePartTarget = 'selected' | 'self' | 'choose';

/** Одна часть урона/лечения эффекта (подмножество DamagePart из VTTG). */
export interface SpellEffectDamagePart {
  /** Формула (напр. "2к8@dmg.poison", "1к4@heal"). */
  formula: string;
  /** Тип урона (для лечения не используется). */
  type?: string;
  /** Цель части (по умолчанию `selected`). */
  target?: SpellEffectDamagePartTarget;
  /** Применять часть только если по носителю нанесён урон (>0). */
  requiresDamage?: boolean;
}

/** Одно числовое изменение, вносимое эффектом. */
export interface SpellEffectChange {
  /** Какой параметр модифицировать (напр. "armorClass", "ability.strength"). */
  key: string;
  /** Как модифицировать. */
  mode: SpellEffectChangeMode;
  /** Числовое значение или формула с @-переменными. */
  value: string;
  /** Опциональное условие (напр. "roll.hasAdvantage === true"). */
  condition?: string;
  /** Приоритет применения (меньше = раньше, по умолчанию 20). */
  priority: number;
}

/** Длительность эффекта. */
export interface SpellEffectDuration {
  type: SpellEffectDurationType;
  /** Начальное количество единиц (для rounds/minutes/hours/days). */
  value?: number;
  /** Оставшееся количество (для rounds, декрементируется в VTTG). */
  remaining?: number;
}

/** Настройки ауры эффекта. */
export interface SpellEffectAura {
  /** Радиус в футах. */
  radius: number;
  /** Кого задевает аура. */
  target: SpellEffectAuraTarget;
  /** Применяется ли эффект к создателю ауры. */
  applyToSelf: boolean;
  /** Отображать ли радиус ауры на сцене. */
  visible?: boolean;
}

/** Спасбросок при наложении эффекта (в момент попадания атакой/областью). */
export interface SpellEffectSave {
  ability: SpellEffectAbility;
  dc: number;
  onSuccess: SpellEffectSaveOutcome;
}

/** Периодический спасбросок для снятия эффекта. */
export interface SpellEffectRecurringSave {
  ability: SpellEffectAbility;
  /** Сложность (`0` = подставить Сл кастера при наложении в VTTG). */
  dc: number;
  timing: SpellEffectSaveTiming;
}

/** Периодический урон (DoT): наносится каждый ход, пока эффект активен. */
export interface SpellEffectRecurringDamage {
  damageParts: SpellEffectDamagePart[];
  timing: SpellEffectSaveTiming;
}

/**
 * Активный эффект заклинания — полная структура VTTG `ActiveEffect`.
 */
export interface SpellActiveEffect {
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
  origin: SpellEffectOrigin;
  /** ID объекта-источника. */
  originId?: string;
  /** Переносится ли эффект с предмета на актора при экипировке. */
  transfer: boolean;
  /** Длительность эффекта. */
  duration: SpellEffectDuration;
  /** Числовые модификаторы. */
  changes: SpellEffectChange[];
  /** Булевы флаги (помеха, преимущество, иммунитеты и т.д.). */
  flags: string[];
  /** Настройки ауры (если эффект транслируется на других). */
  aura?: SpellEffectAura;
  /** Триггер для эффектов области/ауры. */
  areaTrigger?: SpellEffectAreaTrigger;
  /** Цель применения эффекта (`self` по умолчанию). */
  effectTarget?: SpellEffectTarget;
  /** Ключ стандартного состояния D&D 5e, если эффект его представляет. */
  conditionKey?: SpellEffectConditionKey;
  /** Спасбросок при наложении. */
  applySave?: SpellEffectSave;
  /** Накладывать эффект-состояние даже при успешном спасброске. */
  applyOnSuccess?: boolean;
  /** Урон при наложении эффекта. */
  damageParts?: SpellEffectDamagePart[];
  /** Периодический спасбросок для снятия эффекта. */
  recurringSave?: SpellEffectRecurringSave;
  /** Периодический урон (DoT). */
  recurringDamage?: SpellEffectRecurringDamage;
}

/** Приоритет по умолчанию для нового изменения. */
export const DEFAULT_SPELL_EFFECT_CHANGE_PRIORITY = 20;

/** Иконка эффекта по умолчанию. */
export const DEFAULT_SPELL_EFFECT_ICON = 'tabler:sparkles';

/** Генерирует уникальный id эффекта. */
function generateEffectId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `effect-${crypto.randomUUID()}`;
  }

  return `effect-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Создаёт пустой активный эффект заклинания с дефолтами VTTG. */
export function createEmptySpellActiveEffect(): SpellActiveEffect {
  return {
    id: generateEffectId(),
    name: 'Новый эффект',
    description: '',
    icon: DEFAULT_SPELL_EFFECT_ICON,
    disabled: false,
    origin: 'spell',
    transfer: false,
    duration: { type: 'permanent' },
    changes: [],
    flags: [],
    effectTarget: 'self',
  };
}

/** Создаёт пустое числовое изменение. */
export function createEmptySpellEffectChange(): SpellEffectChange {
  return {
    key: 'armorClass',
    mode: 'add',
    value: '1',
    condition: '',
    priority: DEFAULT_SPELL_EFFECT_CHANGE_PRIORITY,
  };
}

/** Создаёт пустую часть урона эффекта. */
export function createEmptySpellEffectDamagePart(): SpellEffectDamagePart {
  return {
    formula: '',
    target: 'selected',
  };
}

/** Флаг по умолчанию для нового элемента списка флагов. */
export const DEFAULT_SPELL_EFFECT_FLAG = 'vision.blinded';

/** Дефолтный спасбросок при включении соответствующих блоков эффекта. */
export const DEFAULT_SPELL_EFFECT_SAVE: SpellEffectSave = {
  ability: 'wisdom',
  dc: 13,
  onSuccess: 'negate',
};

/** Дефолтные параметры ауры при её включении. */
export const DEFAULT_SPELL_EFFECT_AURA: SpellEffectAura = {
  radius: 10,
  target: 'allies',
  applyToSelf: true,
  visible: true,
};

/** Нормализует часть урона эффекта: trim формулы, сброс пустых полей. */
function normalizeSpellEffectDamagePart(
  part: SpellEffectDamagePart,
): SpellEffectDamagePart {
  const formula = part.formula.trim();
  const isHealing = formula.includes('@heal');

  return {
    formula,
    type: isHealing ? undefined : part.type,
    target: part.target ?? 'selected',
    requiresDamage: part.requiresDamage || undefined,
  };
}

/** Отбрасывает части без формулы и нормализует оставшиеся. */
function normalizeSpellEffectDamageParts(
  parts: SpellEffectDamagePart[] | undefined,
): SpellEffectDamagePart[] | undefined {
  if (!parts?.length) {
    return undefined;
  }

  const cleaned = parts
    .filter((part) => part.formula.trim().length > 0)
    .map(normalizeSpellEffectDamagePart);

  return cleaned.length > 0 ? cleaned : undefined;
}

/** Нормализует одно изменение: trim ключа/значения, пустое условие → undefined. */
function normalizeSpellEffectChange(
  change: SpellEffectChange,
): SpellEffectChange {
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
 * Нормализует один активный эффект перед отправкой на сервер:
 * - убирает пустые изменения (без ключа или значения) и пустые флаги;
 * - очищает части урона без формулы;
 * - сбрасывает `aura`/`effectTarget` во взаимоисключающих режимах.
 */
function normalizeSpellActiveEffect(
  effect: SpellActiveEffect,
): SpellActiveEffect {
  const changes = effect.changes
    .map(normalizeSpellEffectChange)
    .filter((change) => change.key.length > 0 && change.value.length > 0);

  const flags = effect.flags
    .map((flag) => flag.trim())
    .filter((flag) => flag.length > 0);

  const damageParts = normalizeSpellEffectDamageParts(effect.damageParts);

  const recurringDamage = effect.recurringDamage
    ? {
        timing: effect.recurringDamage.timing,
        damageParts:
          normalizeSpellEffectDamageParts(effect.recurringDamage.damageParts)
          ?? [],
      }
    : undefined;

  // Аура и эффект на цель — взаимоисключающие режимы.
  const aura = effect.effectTarget === 'target' ? undefined : effect.aura;

  return {
    ...effect,
    name: effect.name.trim(),
    description: effect.description.trim(),
    icon: effect.icon?.trim() || undefined,
    changes,
    flags,
    aura,
    damageParts,
    recurringDamage,
  };
}

/**
 * Нормализует массив активных эффектов перед сохранением.
 * Отбрасывает эффекты без названия.
 */
export function normalizeSpellActiveEffects(
  effects: SpellActiveEffect[] | undefined,
): SpellActiveEffect[] {
  if (!effects?.length) {
    return [];
  }

  return effects
    .map(normalizeSpellActiveEffect)
    .filter((effect) => effect.name.length > 0);
}

// ── Zod-схемы для валидации загруженных с сервера данных ──────────
// Внешние данные считаем `unknown` и валидируем через Zod (см. AGENTS.md),
// без приведений типов. Закрытые наборы значений описаны через `z.enum`,
// открытые (флаги, ключи изменений, типы урона) — как строки.

const durationSchema: z.ZodType<SpellEffectDuration> = z.object({
  type: z.enum(['permanent', 'rounds', 'minutes', 'hours', 'days', 'special']),
  value: z.number().optional(),
  remaining: z.number().optional(),
});

const changeSchema: z.ZodType<SpellEffectChange> = z.object({
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

const damagePartSchema: z.ZodType<SpellEffectDamagePart> = z.object({
  formula: z.string(),
  type: z.string().optional(),
  target: z.enum(['selected', 'self', 'choose']).optional(),
  requiresDamage: z.boolean().optional(),
});

const auraSchema: z.ZodType<SpellEffectAura> = z.object({
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

const saveSchema: z.ZodType<SpellEffectSave> = z.object({
  ability: abilitySchema,
  dc: z.number(),
  onSuccess: z.enum(['negate', 'half']),
});

const recurringSaveSchema: z.ZodType<SpellEffectRecurringSave> = z.object({
  ability: abilitySchema,
  dc: z.number(),
  timing: z.enum(['startOfTurn', 'endOfTurn']),
});

const recurringDamageSchema: z.ZodType<SpellEffectRecurringDamage> = z.object({
  damageParts: z.array(damagePartSchema),
  timing: z.enum(['startOfTurn', 'endOfTurn']),
});

const activeEffectSchema: z.ZodType<SpellActiveEffect> = z.object({
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
  conditionKey: z
    .enum([
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
    ])
    .optional(),
  applySave: saveSchema.optional(),
  applyOnSuccess: z.boolean().optional(),
  damageParts: z.array(damagePartSchema).optional(),
  recurringSave: recurringSaveSchema.optional(),
  recurringDamage: recurringDamageSchema.optional(),
});

/**
 * Нормализует массив активных эффектов, загруженный с сервера.
 * Валидирует каждый эффект Zod-схемой и отбрасывает некорректные,
 * чтобы одна битая запись не обнулила весь список.
 */
export function normalizeLoadedSpellActiveEffects(
  raw: unknown,
): SpellActiveEffect[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const effects: SpellActiveEffect[] = [];

  for (const item of raw) {
    const parsed = activeEffectSchema.safeParse(item);

    if (parsed.success) {
      effects.push(parsed.data);
    }
  }

  return effects;
}
