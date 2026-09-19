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

/** Моменты периодического спасброска: начало или конец хода носителя. */
export const EFFECT_SAVE_TIMINGS = ['startOfTurn', 'endOfTurn'] as const;

/** Момент периодического спасброска/урона. */
export type EffectSaveTiming = (typeof EFFECT_SAVE_TIMINGS)[number];

/**
 * Как эффект начинает действовать: `use` — накладывается применением
 * источника (зелье, стрела, кнопка «Применить»), `toggle` — включается
 * переключателем («Ярость»).
 */
export const EFFECT_ACTIVATION_MODES = ['use', 'toggle'] as const;

/** Способ применения или включения эффекта. */
export type EffectActivationMode = (typeof EFFECT_ACTIVATION_MODES)[number];

/** Способы применения по имени: редакторы-хозяева ссылаются на них, не на строку. */
export const EFFECT_ACTIVATION_MODE = {
  use: 'use',
  toggle: 'toggle',
} as const satisfies Record<EffectActivationMode, EffectActivationMode>;

/** Сколько тратит применение или включение без поля `amount`. */
export const DEFAULT_ACTIVATION_AMOUNT = 1;

/** Применение или включение эффекта. */
export interface EffectActivation {
  /** Накладывается применением или включается переключателем. */
  mode: EffectActivationMode;
  /**
   * Счётчик листа VTTG (ключ счётчика класса: `rages`), который тратит
   * применение или включение; нет — ничего не тратит (у предмета тратятся его
   * заряды).
   */
  counter?: string;
  /** Сколько тратится со счётчика; нет — одна единица. */
  amount?: number;
}

/** Как выбирается вариант группы: тем, кто бросает, или случаем. */
export const EFFECT_VARIANT_PICKS = ['choose', 'random'] as const;

/** Выбор варианта эффекта. */
export type EffectVariantPick = (typeof EFFECT_VARIANT_PICKS)[number];

/** Выбор без поля `pick`: вариант называет тот, кто бросает. */
export const DEFAULT_EFFECT_VARIANT_PICK: EffectVariantPick = 'choose';

/** Вариант эффекта в группе альтернатив. */
export interface EffectVariant {
  /** Ключ группы: эффекты с одним ключом — альтернативы. */
  group: string;
  /** Подпись варианта в выборе и в чате. */
  label: string;
  /** Как выбирается вариант группы; нет — называет тот, кто бросает. */
  pick?: EffectVariantPick;
}

/**
 * Цель части урона/лечения внутри эффекта.
 * `selected` — выбранная цель, `self` — носитель, `choose` — отдельная цель.
 */
export type EffectDamagePartTarget = 'selected' | 'self' | 'choose';

/** Тип урона (ключ словаря VTTG, lowercase). */
export type EffectDamageType =
  | 'slashing'
  | 'piercing'
  | 'bludgeoning'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'thunder'
  | 'poison'
  | 'acid'
  | 'necrotic'
  | 'radiant'
  | 'force'
  | 'psychic';

/** Вид лечения части: `@heal` — хиты, `@heal.temp` — временные хиты. */
export type EffectHealKind = 'hp' | 'temp';

/** Одна часть урона/лечения эффекта (подмножество DamagePart из VTTG). */
export interface EffectDamagePart {
  /** Формула (напр. "2к8@dmg.poison", "1к4@heal"). */
  formula: string;
  /** Тип урона (для лечения не используется). */
  type?: string;
  /** Цель части (по умолчанию `selected`). */
  target?: EffectDamagePartTarget;
  /** Применять часть только если по носителю нанесён урон (больше нуля). */
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
  /**
   * Радиус формулой от носителя («10 фт, на 18-м уровне — 30» пишется
   * `10 + 20 * floor(@classLevel / 18)`). VTTG считает её при сборе аур и
   * кладёт результат в `radius`.
   */
  radiusFormula?: string;
  /** Аура гаснет, пока носитель недееспособен («Аура защиты»). */
  whileCapable?: true;
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
  /**
   * Условие наложения: эффект ложится, только если оно выполнено. Строка
   * словаря срабатываний на событии «при наложении»: субъект — тот, на кого
   * ложится эффект, другая сторона — кто накладывает; `source.weaponMastery` —
   * атакующий владеет приёмом оружия («Опрокидывание»). Считается до урона
   * этого удара.
   */
  landingCondition?: string;
  /**
   * Вариант: из эффектов одной группы ложится один — выбранный при касте или
   * случайный («Глухота/слепота», «Лучи глаз»).
   */
  variant?: EffectVariant;
  /**
   * Условие броска: эффект не входит в числа листа и действует только в
   * бросках, где условие выполнено, — флагами и прибавками. Строка словаря
   * модификаторов (`EFFECT_CONDITION_EXPR_SUGGESTIONS`): «Тактика стаи» —
   * `target.allyAdjacent`, «Защита от добра и зла» —
   * `incoming.attackerCreatureType === "fiend"`.
   */
  rollCondition?: string;
  /**
   * Применение или включение: эффект не действует сам, пока источник не
   * применили («Зелье лечения», «Стрела +1») или эффект не включили
   * («Ярость»). Нет поля — действует постоянно.
   */
  activation?: EffectActivation;
}

/**
 * Накладывается ли эффект только применением источника.
 *
 * @param effect эффект.
 * @returns `true` для `activation.mode === 'use'`.
 */
export function isUseActivatedEffect(
  effect: Pick<ActiveEffect, 'activation'>,
): boolean {
  return effect.activation?.mode === 'use';
}

/**
 * Включают ли эффект переключателем.
 *
 * @param effect эффект.
 * @returns `true` для `activation.mode === 'toggle'`.
 */
export function isToggleActivatedEffect(
  effect: Pick<ActiveEffect, 'activation'>,
): boolean {
  return effect.activation?.mode === 'toggle';
}

/**
 * Спит ли эффект: выключен или ждёт применения. Спящий эффект лежит на листе
 * или предмете, но не действует — ни числами, ни флагами.
 *
 * @param effect эффект.
 * @returns `true`, если эффект сейчас не действует.
 */
export function isEffectDormant(
  effect: Pick<ActiveEffect, 'disabled' | 'activation'>,
): boolean {
  return effect.disabled || isUseActivatedEffect(effect);
}

/**
 * Эффект, который ложится на лист из умения, черты или предмета: с применением
 * или включением — выключенным. Переключаемый включают руками, шаблон
 * применения не действует никогда. Зеркало `withActivationDefaults` системы.
 *
 * @param effect эффект записи.
 * @returns эффект для листа.
 */
export function withActivationDefaults(effect: ActiveEffect): ActiveEffect {
  return effect.activation ? { ...effect, disabled: true } : effect;
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
  const numericValue = Number(trimmed);

  return trimmed === '' || !Number.isFinite(numericValue)
    ? undefined
    : numericValue;
}
