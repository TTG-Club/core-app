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

import type {
  EffectAbility,
  EffectDamagePart,
  EffectDuration,
  EffectRecurringSave,
} from './types';

/** События, на которые срабатывание реагирует. */
export const EFFECT_TRIGGER_EVENTS = [
  'turnStart',
  'turnEnd',
  'enter',
  'exit',
  'applied',
  'attackRoll',
  'damageTaken',
  'hpZero',
  'castEnd',
  'rest',
  'activate',
] as const;

/**
 * События следующих фаз: разбираются и сохраняются, чтобы версия без их
 * поддержки не стирала их у записи, но пока ничего не запускают. Сейчас таких
 * нет.
 */
export const EFFECT_TRIGGER_RESERVED_EVENTS = [] as const;

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
 * События с уроном в данных: урон события, его типы и крит. «При наложении» —
 * урон удара, которым эффект наложен («максимум хитов уменьшается на
 * полученный некротический урон»).
 */
export const DAMAGE_DATA_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  ...DAMAGE_TRIGGER_EVENTS,
  'applied',
];

/**
 * События с другой стороной: противник на броске атаки, тот, кто нанёс урон,
 * тот, кто наложил эффект. Ей можно отдать действия срабатывания.
 */
export const OTHER_PARTY_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'attackRoll',
  'damageTaken',
  'applied',
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
export const EFFECT_TRIGGER_RECIPIENTS = [
  'subject',
  'other',
  'area',
  'choice',
] as const;

/** Получатель «всем в радиусе». */
export const AREA_TRIGGER_RECIPIENT = 'area';

/** Получатель «по выбору»: кого задеть, решает человек. */
export const CHOICE_TRIGGER_RECIPIENT = 'choice';

/**
 * Получатель действий: субъект — тот, на ком эффект, — другая сторона
 * события (кто нанёс урон), все в радиусе от субъекта (`area`: взрыв при
 * смерти) или выбранные человеком (`choice`: «лечит одно существо на выбор»).
 * Снятие эффекта всегда про эффект субъекта.
 */
export type EffectTriggerRecipient = (typeof EFFECT_TRIGGER_RECIPIENTS)[number];

/** Получатель без поля `recipient`: субъект — в данных он не пишется. */
export const DEFAULT_TRIGGER_RECIPIENT: EffectTriggerRecipient = 'subject';

/** Кого задевает «всем в радиусе». */
export const EFFECT_TRIGGER_AREA_TARGETS = [
  'all',
  'allies',
  'enemies',
] as const;

/** Кого задевает «всем в радиусе»: отношение к субъекту по фишкам. */
export type EffectTriggerAreaTarget =
  (typeof EFFECT_TRIGGER_AREA_TARGETS)[number];

/** Кого задевает «всем в радиусе» без поля `target`. */
export const DEFAULT_TRIGGER_AREA_TARGET: EffectTriggerAreaTarget = 'all';

/** Радиус новой строки «всем в радиусе», фт. */
export const DEFAULT_TRIGGER_AREA_RADIUS = 10;

/** Наименьший радиус «всем в радиусе»: нулевой задевает только свою клетку. */
export const MIN_TRIGGER_AREA_RADIUS = 0;

/** «Всем в радиусе»: кому достаются действия. */
export interface EffectTriggerArea {
  /** Радиус от фишки субъекта, фт. */
  radius: number;
  /** Кого задевает; нет — всех, кроме субъекта. */
  target?: EffectTriggerAreaTarget;
}

/**
 * События с получателем «всем в радиусе»: их выполняет сервер VTTG со сценой
 * в контексте — урон, «0 хитов», наложение, бросок атаки.
 */
export const AREA_RECIPIENT_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'damageTaken',
  'hpZero',
  'applied',
  'attackRoll',
];

/**
 * События с получателем «по выбору». Спрашивают и на границе хода: «аура лечит
 * одно существо на выбор в начале своего хода» — самый частый рецепт.
 */
export const CHOICE_RECIPIENT_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'turnStart',
  'turnEnd',
  'damageTaken',
  'hpZero',
  'applied',
  'attackRoll',
  'enter',
  'exit',
];

/** Кто выбирает получателей: носитель эффекта или тот, кто его наложил. */
export const EFFECT_TRIGGER_CHOOSERS = ['subject', 'source'] as const;

/** Выбирающий. */
export type EffectTriggerChooser = (typeof EFFECT_TRIGGER_CHOOSERS)[number];

/** Кто выбирает без поля `chooser`: носитель эффекта. */
export const DEFAULT_TRIGGER_CHOOSER: EffectTriggerChooser = 'subject';

/** Сколько целей выбирают без поля `count`. */
export const DEFAULT_TRIGGER_CHOICE_COUNT = 1;

/** Радиус новой строки «по выбору», фт. */
export const DEFAULT_TRIGGER_CHOICE_RADIUS = 30;

/** Больше целей одним выбором не просят. */
export const MAX_TRIGGER_CHOICE_COUNT = 20;

/**
 * «По выбору»: кандидаты и сколько из них задеть.
 *
 * Кандидаты отбираются так же, как «всем в радиусе» (радиус от фишки субъекта и
 * отношение фишек), и дополнительно просеиваются условием из общего словаря
 * условий — «только нежить», «только раненые». Что достанется выбранным, решают
 * действия срабатывания: урон, лечение, временные хиты, состояние, отметка.
 */
export interface EffectTriggerChoice {
  /** Радиус от фишки субъекта, фт. */
  radius: number;
  /** Кого можно выбрать; нет — всех, кроме субъекта. */
  target?: EffectTriggerAreaTarget;
  /** Сколько целей просят выбрать; нет — одну. */
  count?: number;
  /** Условие кандидата строкой словаря условий; нет — любой. */
  condition?: string;
  /** Выбор добровольный: отказ законен и не считается сбоем. */
  optional?: true;
  /** Кто выбирает; нет — носитель эффекта. */
  chooser?: EffectTriggerChooser;
}

/**
 * События, на которые реагирует наложенное состояние. Оно живёт своей жизнью на
 * цели: каст, применение и наложение — про эффект-источник, у состояния их не
 * бывает.
 */
export const NESTED_TRIGGER_EVENTS: readonly EffectTriggerEvent[] = [
  'damageTaken',
  'hpZero',
  'turnStart',
  'turnEnd',
  'attackRoll',
  'rest',
];

/** Событие нового вложенного срабатывания: «Сон» просыпается от урона. */
export const DEFAULT_NESTED_TRIGGER_EVENT: EffectTriggerEvent = 'damageTaken';

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

/** Режимы спасброска срабатывания сверх флагов бросающего. */
export const EFFECT_TRIGGER_SAVE_MODES = ['advantage', 'disadvantage'] as const;

/**
 * Режим спасброска срабатывания: «повторяет спасбросок с преимуществом, если
 * урон нанёс заклинатель» («Жуткий смех Таши»). Складывается с флагами
 * бросающего по обычному правилу: преимущество и помеха гасятся.
 */
export type EffectTriggerSaveMode = (typeof EFFECT_TRIGGER_SAVE_MODES)[number];

/** Какой отдых запускает срабатывание «после отдыха». */
export const EFFECT_TRIGGER_REST_TYPES = ['long', 'short', 'any'] as const;

/** Отдых срабатывания: долгий, короткий или любой. */
export type EffectTriggerRestType = (typeof EFFECT_TRIGGER_REST_TYPES)[number];

/** Отдых без поля `restType`: долгий — в данных он не пишется. */
export const DEFAULT_TRIGGER_REST_TYPE: EffectTriggerRestType = 'long';

/** Уменьшение максимума хитов, которое снимают только руками. */
export const MAX_HP_REDUCTION_NEVER_ENDS = 'never';

/** Когда проходит уменьшение максимума хитов: отдых или никогда. */
export const EFFECT_TRIGGER_MAX_HP_REST_ENDS = [
  ...EFFECT_TRIGGER_REST_TYPES,
  MAX_HP_REDUCTION_NEVER_ENDS,
] as const;

/** Конец уменьшения максимума хитов. */
export type EffectTriggerMaxHpRestEnd =
  (typeof EFFECT_TRIGGER_MAX_HP_REST_ENDS)[number];

/** Спасбросок срабатывания; Сл 0 — Сл источника, как у остальных полей. */
export interface EffectTriggerSave {
  ability: EffectAbility;
  dc: number;
  /** Преимущество или помеха самого спасброска. */
  mode?: EffectTriggerSaveMode;
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
  /**
   * Повторный спасбросок наложенного состояния: «провал — парализован,
   * повторяет спасбросок в конце каждого своего хода». Сл 0 — Сл источника.
   */
  recurringSave?: EffectRecurringSave;
  /**
   * Собственные срабатывания наложенного состояния: «Сон» кладёт
   * «Бессознательного», который снимается, когда цель получает урон. Без них
   * пришлось бы заканчивать каст — а он снял бы сон со ВСЕХ целей.
   *
   * Одна ступень вложенности: у вложенного срабатывания своё `applyCondition`
   * вложенных уже не несёт.
   */
  triggers?: NestedEffectTrigger[];
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
 * @param tag строка.
 * @returns `true`, если это ключ отметки.
 */
export function isEffectTag(tag: string): boolean {
  return EFFECT_TAG_PATTERN.test(tag);
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
  /**
   * Счётчик: повторная отметка тем же ключом прибавляет ступень, а не
   * заменяет прежнюю («три провала — окаменение»). Условие
   * `self.tagCount["ключ"] >= N` читает число ступеней.
   */
  stack?: true;
  on?: EffectTriggerActionGate;
}

/**
 * Максимум хитов получателя уменьшается: «максимум хитов уменьшается на
 * полученный урон, пока цель не закончит долгий отдых». Уменьшения
 * складываются в одну метку.
 */
export interface EffectTriggerReduceMaxHpAction {
  type: 'reduceMaxHp';
  /** На сколько: число, кости или `@damage` — урон события. */
  amount: string;
  /** Какой отдых возвращает максимум; `never` — только снятие руками. */
  endsOnRest?: EffectTriggerMaxHpRestEnd;
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
  | EffectTriggerReduceMaxHpAction
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
  /** Для отдыха: какой отдых; не задано — долгий. */
  restType?: EffectTriggerRestType;
  /** Кому достаются урон, лечение и наложения; не задано — субъекту. */
  recipient?: EffectTriggerRecipient;
  /** Радиус и отбор для получателя «всем в радиусе». */
  area?: EffectTriggerArea;
  /** Кандидаты и число целей для получателя «по выбору». */
  choice?: EffectTriggerChoice;
  /** Условие в словаре условий срабатываний (`triggerConditions.ts`). */
  condition?: string;
  save?: EffectTriggerSave;
  actions: EffectTriggerAction[];
  limit?: EffectTriggerLimit;
}

/**
 * Действие вложенного срабатывания. Наложение состояния в нём своих
 * срабатываний уже не несёт: вложенность — на одну ступень, иначе форма и схема
 * стали бы бесконечными.
 */
export type NestedEffectTriggerAction =
  | Exclude<EffectTriggerAction, EffectTriggerApplyConditionAction>
  | Omit<EffectTriggerApplyConditionAction, 'triggers'>;

/** Срабатывание, которое несёт на себе наложенное состояние. */
export interface NestedEffectTrigger extends Omit<EffectTrigger, 'actions'> {
  actions: NestedEffectTriggerAction[];
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
