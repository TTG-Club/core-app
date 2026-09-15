/**
 * Модель «Активных эффектов», совместимая с системой Active Effects приложения
 * VTTG (Virtual TTG Club). Одна и та же у всего, что меняет числа на листе
 * персонажа: заклинаний, черт и магических предметов.
 *
 * Структура повторяет `ActiveEffect` системы dnd5e-2024 один-в-один, чтобы
 * экспорт в VTTG был pass-through без преобразования словарей: характеристики
 * хранятся полными именами (`strength`…`charisma`), ключи состояний, режимов и
 * флагов — в тех же строковых значениях, что и в VTTG.
 *
 * Зеркало: dnd5-test-migrate/src/engine/activeEffectTypes.ts
 */

import type { EffectTrigger } from './triggerTypes';

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

/**
 * Ключи источников — единственное место, где они перечислены значениями:
 * отсюда их берут и редактор-хозяин в `origin`, и подписи справочника, и разбор
 * загруженного эффекта. `Record<EffectOrigin, EffectOrigin>` держит набор в
 * согласии с типом: новый источник в юнионе не даст собраться, пока его не
 * заведут и здесь.
 */
export const EFFECT_ORIGIN = {
  spell: 'spell',
  item: 'item',
  feature: 'feature',
  condition: 'condition',
  manual: 'manual',
  area: 'area',
} as const satisfies Record<EffectOrigin, EffectOrigin>;

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

/**
 * Куда доставляется эффект:
 * - `self` (по умолчанию) — на носителе;
 * - `target` — на цели при попадании атакой или задетой заклинанием;
 * - `zone` — в зону, которую заклинание оставляет на месте шаблона; на
 *   заклинателе и на целях каста не действует.
 */
export type EffectTarget = 'self' | 'target' | 'zone';

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
  /** Сложность (`0` = Сл источника: заклинателя, действия, оружия). */
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
  /**
   * Спасбросок против урона на каждом тике: провал — полный урон, успех — по
   * `onSuccess` (без урона или половина). Эффект при этом остаётся — снимает
   * его только `recurringSave`. `dc === 0` — Сл заклинателя.
   */
  save?: EffectSave;
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
  /**
   * Прежний признак переноса с предмета. Движок VTTG его не читает — у
   * надетого предмета переносятся все эффекты, — но в данных поле остаётся.
   */
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
  /** Куда доставляется эффект (`self` по умолчанию). */
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
   * Срабатывания, которых не выражают старые поля (урон каждый ход, повторный
   * спасбросок, снятие после атаки): лимит «раз в ход», состояние на ходу,
   * ход источника. Старые поля читаются как срабатывания `legacy.*` —
   * `collectEffectTriggers` (`triggers.ts`).
   */
  triggers?: EffectTrigger[];
  /**
   * Состояния, к которым эффект даёт иммунитет носителю (напр. Окаменевший
   * даёт иммунитет к Отравлению).
   */
  conditionImmunities?: EffectConditionKey[];
  /** Степень Истощения (1–6), если `conditionKey === 'exhaustion'`. */
  exhaustionLevel?: number;
}

/** Приоритет по умолчанию для нового изменения. */
export const DEFAULT_EFFECT_CHANGE_PRIORITY = 20;

/** Иконка эффекта по умолчанию. */
export const DEFAULT_EFFECT_ICON = 'tabler:sparkles';

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

/** Цель части урона без поля: выбранная цель. */
export const DEFAULT_EFFECT_DAMAGE_PART_TARGET: EffectDamagePartTarget =
  'selected';

/** Создаёт пустую часть урона эффекта. */
export function createEmptyEffectDamagePart(): EffectDamagePart {
  return {
    formula: '',
    target: DEFAULT_EFFECT_DAMAGE_PART_TARGET,
  };
}

/** Флаг по умолчанию для нового элемента списка флагов. */
export const DEFAULT_EFFECT_FLAG = 'vision.blinded';

/**
 * Читает число из поля формы: число как есть, строку с числом — числом.
 *
 * Поле ввода числа отдаёт пустую строку, когда его очистили, а без
 * модификатора `.number` — строку с числом.
 *
 * @param value значение поля ввода.
 * @returns число либо `undefined` для пустого, нечислового ввода и `NaN`.
 */
export function parseFormNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  const parsed = Number(trimmed);

  return trimmed === '' || !Number.isFinite(parsed) ? undefined : parsed;
}
