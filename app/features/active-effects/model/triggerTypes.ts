/**
 * «Срабатывания» эффекта: единая модель «когда → если → спасбросок → что
 * сделать → сколько раз».
 *
 * Раньше каждое «когда» было отдельным полем со своим интерпретатором: урон
 * каждый ход, повторный спасбросок, снятие после атаки. Срабатывание описывает их
 * одной формой, а новые правила («Зловоние» в начале хода, «раз в ход»)
 * собираются из тех же частей, без новой галочки на каждое.
 *
 * Старые поля эффекта остаются в данных: их читает `collectEffectTriggers`
 * (`triggers.ts`) как срабатывания с зарезервированными id `legacy.*`, а новое,
 * чего старые поля не выражают, лежит в `ActiveEffect.triggers`.
 *
 * Зеркало: dnd5-test-migrate/src/engine/effectTriggerTypes.ts
 */

import type { EffectAbility, EffectDamagePart, EffectDuration } from './types';

/** События, на которые срабатывание реагирует уже сейчас. */
export const EFFECT_TRIGGER_EVENTS = [
  'turnStart',
  'turnEnd',
  'enter',
  'exit',
  'applied',
  'attackRoll',
  'damageTaken',
  'hpZero',
] as const;

/**
 * События следующих фаз: разбираются и сохраняются, чтобы версия без их
 * поддержки не стирала их у записи, но пока ничего не запускают.
 */
export const EFFECT_TRIGGER_RESERVED_EVENTS = [
  'rest',
  'activate',
  'castEnd',
] as const;

/** Событие, на которое реагирует срабатывание. */
export type EffectTriggerEvent =
  | (typeof EFFECT_TRIGGER_EVENTS)[number]
  | (typeof EFFECT_TRIGGER_RESERVED_EVENTS)[number];

/** Начало и конец хода: у них выбирается, чей это ход. */
export const TURN_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'turnStart',
  'turnEnd',
];

/** Вход в зону или ауру и выход из неё. */
export const PRESENCE_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'enter',
  'exit',
];

/** События урона: несут урон (`@damage`, типы, критический удар). */
export const DAMAGE_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'damageTaken',
  'hpZero',
];

/**
 * События с другой стороной: противник на броске атаки, тот, кто нанёс урон.
 * Ей можно отдать действия срабатывания.
 */
export const OTHER_PARTY_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'attackRoll',
  'damageTaken',
];

/** Чей ход считает событие начала или конца хода. */
export const EFFECT_TRIGGER_TURN_OWNERS = ['subject', 'source'] as const;

/**
 * Чей ход: субъекта — того, на ком эффект действует, — или источника,
 * наложившего эффект.
 */
export type EffectTriggerTurnOwner =
  (typeof EFFECT_TRIGGER_TURN_OWNERS)[number];

/** Чей ход без поля `turnOf`: ход субъекта — в данных он не пишется. */
export const DEFAULT_TRIGGER_TURN_OWNER: EffectTriggerTurnOwner = 'subject';

/** Кому достаются действия срабатывания. */
export const EFFECT_TRIGGER_RECIPIENTS = ['subject', 'other'] as const;

/**
 * Получатель действий: субъект — тот, на ком эффект, — или другая сторона
 * события: кто нанёс урон. Снятие эффекта всегда про эффект субъекта.
 */
export type EffectTriggerRecipient = (typeof EFFECT_TRIGGER_RECIPIENTS)[number];

/** Получатель без поля `recipient`: субъект — в данных он не пишется. */
export const DEFAULT_TRIGGER_RECIPIENT: EffectTriggerRecipient = 'subject';

/** Роль субъекта в броске атаки. */
export const EFFECT_TRIGGER_ATTACK_ROLES = ['attacker', 'target'] as const;

/** Субъект атакует или атакуют его. */
export type EffectTriggerAttackRole =
  (typeof EFFECT_TRIGGER_ATTACK_ROLES)[number];

/** Роль без поля `role`: срабатывание на своей атаке. */
export const DEFAULT_TRIGGER_ATTACK_ROLE: EffectTriggerAttackRole = 'attacker';

/** Когда выполняется действие относительно спасброска срабатывания. */
export const EFFECT_TRIGGER_ACTION_GATES = [
  'always',
  'failed',
  'saved',
] as const;

/**
 * Гейт действия: всегда, при провале или при успехе спасброска. Без своего
 * спасброска гейт сверяется со спасброском действия или заклинания, которое
 * эффект наложило. Не задан — `failed`, если спасбросок есть, иначе `always`.
 */
export type EffectTriggerActionGate =
  (typeof EFFECT_TRIGGER_ACTION_GATES)[number];

/** Периоды лимита «не чаще N раз». */
export const EFFECT_TRIGGER_LIMIT_PERIODS = [
  'turn',
  'round',
  'shortRest',
  'longRest',
] as const;

/** За какой период считается лимит. */
export type EffectTriggerLimitPeriod =
  (typeof EFFECT_TRIGGER_LIMIT_PERIODS)[number];

/** Лимит «не чаще N раз» — от одного раза. */
export const MIN_TRIGGER_LIMIT_MAX = 1;

/** Спасбросок срабатывания; Сл 0 — Сл источника, как у остальных полей. */
export interface EffectTriggerSave {
  ability: EffectAbility;
  dc: number;
  /**
   * Сл формулой от данных события: `@damage` — урон события
   * («max(10, floor(@damage / 2))»). Нет данных или формула с ошибкой — `dc`.
   */
  dcFormula?: string;
}

/** Лимит «не чаще N раз за период». */
export interface EffectTriggerLimit {
  max: number;
  per: EffectTriggerLimitPeriod;
  /**
   * Общий счётчик нескольких срабатываний: «урон зоны раз в ход» считает и вход,
   * и начало хода одним лимитом.
   */
  key?: string;
}

/** Урон или лечение (`@heal`, `@heal.temp` — лечение не гейтится спасброском). */
export interface EffectTriggerDamageAction {
  type: 'damage';
  parts: EffectDamagePart[];
  on?: EffectTriggerActionGate;
  /** Успешный спасбросок — половина урона (при гейте `always`). */
  halfOnSave?: true;
}

/** Длящаяся копия самого эффекта на субъекте. */
export interface EffectTriggerApplySelfAction {
  type: 'applySelf';
  on?: EffectTriggerActionGate;
}

/** Состояние на субъекте. */
export interface EffectTriggerApplyConditionAction {
  type: 'applyCondition';
  /** Ключ состояния — канонного либо заведённого в мире VTTG. */
  conditionKey: string;
  duration?: EffectDuration;
  on?: EffectTriggerActionGate;
}

/**
 * Ключ отметки: буквы, цифры, `_`, `.` и `-`. Отметка попадает в строку
 * условия (`self.tag === "…"`), и кавычки или `&&` в ключе её бы сломали.
 */
export const EFFECT_TAG_PATTERN = /^[\p{L}\p{N}_.-]{1,64}$/u;

/** Ключ новой отметки, пока автор не назвал свою. */
export const DEFAULT_EFFECT_TAG = 'отметка';

/**
 * Годится ли строка ключом отметки.
 *
 * @param value строка.
 * @returns `true`, если это ключ отметки.
 */
export function isEffectTag(value: string): boolean {
  return EFFECT_TAG_PATTERN.test(value);
}

/**
 * Отметка на субъекте: лёгкий эффект без нагрузки, который читают условия
 * других срабатываний — «Регенерация не работает до начала следующего хода»
 * после урона огнём. Повторная отметка тем же ключом обновляет прежнюю.
 */
export interface EffectTriggerApplyTagAction {
  type: 'applyTag';
  /** Ключ: по нему условие `self.tag === "…"` узнаёт отметку. */
  tag: string;
  /** Имя отметки в списке эффектов; нет — ключ. */
  label?: string;
  /** Срок; нет — до начала следующего хода носителя. */
  duration?: EffectDuration;
  on?: EffectTriggerActionGate;
}

/** Хиты получателя становятся числом: «вместо 0 хитов — 1 хит». */
export interface EffectTriggerSetHpAction {
  type: 'setHp';
  value: number;
  on?: EffectTriggerActionGate;
}

/**
 * Закончить каст, который держит эффект: снимаются сам эффект и все эффекты
 * этого каста у всех существ, и его зона («провал спасброска концентрации»).
 */
export interface EffectTriggerEndCastAction {
  type: 'endCast';
  on?: EffectTriggerActionGate;
}

/** Снять сам эффект. */
export interface EffectTriggerRemoveSelfAction {
  type: 'removeSelf';
  on?: EffectTriggerActionGate;
}

/** Что срабатывание делает. */
export type EffectTriggerAction =
  | EffectTriggerDamageAction
  | EffectTriggerApplySelfAction
  | EffectTriggerApplyConditionAction
  | EffectTriggerApplyTagAction
  | EffectTriggerSetHpAction
  | EffectTriggerEndCastAction
  | EffectTriggerRemoveSelfAction;

/** Срабатывание эффекта. */
export interface EffectTrigger {
  /** Стабильный id; `legacy.*` зарезервированы под выведенные из старых полей. */
  id: string;
  event: EffectTriggerEvent;
  /** Для начала и конца хода: чей ход; не задано — субъекта. */
  turnOf?: EffectTriggerTurnOwner;
  /** Для броска атаки: роль субъекта. */
  role?: EffectTriggerAttackRole;
  /** Кому достаются урон, лечение и наложения; не задано — субъекту. */
  recipient?: EffectTriggerRecipient;
  /** Условие в словаре условий срабатываний (`triggerConditions.ts`). */
  condition?: string;
  save?: EffectTriggerSave;
  actions: EffectTriggerAction[];
  limit?: EffectTriggerLimit;
}

/** Приставка id срабатываний, выведенных из старых полей эффекта. */
export const LEGACY_TRIGGER_ID_PREFIX = 'legacy.';

/** Id срабатываний, выведенных из старых полей. */
export const LEGACY_TRIGGER_IDS = {
  landing: `${LEGACY_TRIGGER_ID_PREFIX}landing`,
  recurringDamage: `${LEGACY_TRIGGER_ID_PREFIX}recurringDamage`,
  recurringSave: `${LEGACY_TRIGGER_ID_PREFIX}recurringSave`,
  consumeOn: `${LEGACY_TRIGGER_ID_PREFIX}consumeOn`,
} as const;

/** Старое поле, которое выражает срабатывание. */
export type LegacyTriggerKind = Exclude<
  keyof typeof LEGACY_TRIGGER_IDS,
  'landing'
>;
