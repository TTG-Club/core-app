import type { ParticipantColor } from '~initiative/model';

import type { CHAT_EVENT_TYPES } from './chatConstants';

/**
 * Игровая комната группы.
 *
 * Происхождений два, и различает их состав. Самостоятельную заводит владелец
 * и зовёт в неё ссылкой. Комната игры привязана к ней, пускает мастера и
 * подавших заявку, ссылкой не зовёт и в общем списке не показывается.
 */
export interface Nexus {
  id: string;
  title: string;
  ownerId: string;
  /** Код приглашения; приходит только владельцу самостоятельной комнаты. */
  inviteCode: string | null;
  /** Игра, чья это комната; `null` — самостоятельная. */
  gameId: string | null;
  /** Открывший — владелец комнаты. */
  owner: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Участник комнаты. Имена живут в core-api: здесь только идентификаторы. */
export interface NexusMember {
  userId: string;
  /** Владелец комнаты — у комнаты игры это её мастер. */
  owner: boolean;
  joinedAt: string;
}

/** Тело создания комнаты. */
export interface CreateNexusRequest {
  title: string;
}

/** Страница выдачи Spring — сервис отдаёт списки только так. */
export interface NexusPage {
  content: Array<Nexus>;
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/* ------------------------------------------------------------------ */
/* Чат комнаты                                                         */
/* ------------------------------------------------------------------ */

export type ChatEventType = (typeof CHAT_EVENT_TYPES)[number];

/** Один выпавший куб. */
export interface ChatDiceValue {
  value: number;
  /** Учтён ли куб в итоге: отброшенные роллером видны зачёркнутыми. */
  valid: boolean;
  critical: 'success' | 'failure' | null;
}

/** Группа кубов одного вида: «2к6» внутри «2к6+1к4». */
export interface ChatDiceGroup {
  label: string | null;
  rolls: Array<ChatDiceValue>;
}

/**
 * Бросок в ленте.
 *
 * `groups` — выпавшие кубы от роллера сайта. `detail`, `results` и
 * `modifier` остались от прежних событий, которые считал сервис, и у новых
 * бросков пусты.
 */
export interface ChatDiceRoll {
  expression: string;
  total: number;
  groups: Array<ChatDiceGroup>;
  /** Чем бросали: оружие, навык, характеристика. */
  subject: string | null;
  detail: string | null;
  results: Array<number>;
  modifier: number;
  label: string | null;
}

/** Применение заклинания в чате. */
export interface ChatSpellCast {
  /** Слаг заклинания в справочнике сайта; у ручного ввода его нет. */
  spellId: string | null;
  name: string;
  level: number | null;
  target: string | null;
}

/** Событие ленты комнаты в том виде, в каком его показывает чат. */
export interface ChatEvent {
  id: string;
  nexusId: string;
  authorId: string;
  clientMessageId: string;
  type: ChatEventType;
  text: string | null;
  diceRoll: ChatDiceRoll | null;
  spellCast: ChatSpellCast | null;
  createdAt: string;
}

/**
 * Событие ленты: либо подтверждённое сервером, либо ещё летящее.
 * Оптимистичная запись живёт до ответа сервера и заменяется по
 * `clientMessageId`.
 */
export interface ChatFeedEvent extends ChatEvent {
  /** `true`, пока сервер не подтвердил отправку. */
  pending: boolean;
  /** `true`, если отправка провалилась и событие можно отправить повторно. */
  failed: boolean;
  /**
   * Исходный черновик неподтверждённой отправки. Нужен и повтору, и показу:
   * результат броска считает сервер, поэтому до ответа в ленте нечего
   * показать, кроме самого выражения из черновика. У подтверждённых
   * сервером событий — `null`.
   */
  draft: ChatEventDraft | null;
}

/**
 * Бросок в отправляемом событии: клиент передаёт готовый результат.
 *
 * Считает его роллер сайта — он знает всю нотацию, включая «2к20вл1»; сервис
 * принимает результат как есть и не пересчитывает.
 */
export interface DiceRollDraft {
  expression: string;
  total: number;
  /** Что выпало на кубах, по группам одного вида. */
  groups: Array<ChatDiceGroup>;
  /** Чем бросали: оружие, навык, характеристика. */
  subject?: string;
  /** Что за бросок: атака, урон, проверка. */
  label?: string;
}

/** Заклинание в отправляемом событии. */
export interface SpellCastDraft {
  /** Слаг заклинания в справочнике сайта. */
  spellId?: string;
  name: string;
  level?: number;
  target?: string;
}

/** Тело отправки события чата. */
export interface CreateChatEventRequest {
  clientMessageId: string;
  type: ChatEventType;
  text?: string;
  diceRoll?: DiceRollDraft;
  spellCast?: SpellCastDraft;
}

/** Черновик сообщения — то, что отдаёт форма отправки. */
export type ChatEventDraft = Omit<CreateChatEventRequest, 'clientMessageId'>;

/** Состояние SSE-подписки. */
export type ChatConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

/* ------------------------------------------------------------------ */
/* Листы персонажей комнаты                                            */
/* ------------------------------------------------------------------ */

/**
 * Лист персонажа, выложенный в комнату.
 *
 * Сам лист живёт в справочнике сайта: здесь только токен общего доступа, по
 * которому его открывает вся комната.
 */
export interface NexusSheet {
  id: string;
  /** Кто выложил лист: он же его и убирает. */
  ownerId: string;
  shareToken: string;
  characterName: string;
  /** Смотрящий может убрать лист из комнаты. */
  canRemove: boolean;
  createdAt: string;
}

/** Тело добавления листа в комнату. */
export interface AddNexusSheetRequest {
  shareToken: string;
  characterName: string;
}

/* ------------------------------------------------------------------ */
/* Трекеры инициативы комнаты                                          */
/* ------------------------------------------------------------------ */

/**
 * Трекер инициативы, заведённый в комнате.
 *
 * Сам бой ведётся в разделе трекеров сайта: комната хранит ссылку на него,
 * чтобы группа находила своё сражение, не роясь в общем списке.
 */
export interface NexusTracker {
  id: string;
  /** Идентификатор трекера в разделе трекеров. */
  trackerId: string;
  title: string;
  createdBy: string;
  /** Смотрящий может убрать трекер из комнаты. */
  canRemove: boolean;
  createdAt: string;
}

/** Тело добавления трекера в комнату. */
export interface AddNexusTrackerRequest {
  trackerId: string;
  title: string;
}

/* ------------------------------------------------------------------ */
/* Идущий бой комнаты                                                  */
/* ------------------------------------------------------------------ */

/**
 * Боец в снимке боя.
 *
 * Существа приходят безымянными и без картинок: состав засады раскрывает
 * мастер, а не карусель комнаты.
 */
export interface FightParticipant {
  id: string;
  name: string;
  /** Персонаж игрока или существо мастера. */
  player: boolean;
  dead: boolean;
  avatarUrl: string | null;
  color: ParticipantColor | null;
}

/**
 * Снимок идущего боя.
 *
 * Сам бой ведётся в разделе трекеров, куда группе входа нет: очередь ходов
 * доезжает до комнаты снимком, который кладёт туда клиент мастера.
 */
export interface FightState {
  /** Идентификатор трекера в разделе трекеров. */
  trackerId: string;
  title: string;
  round: number;
  /** Идёт ли бой: в подготовке карусель комнате не показывают. */
  active: boolean;
  currentParticipantId: string | null;
  participants: Array<FightParticipant>;
  updatedAt: string;
}

/** Тело отправки снимка: название и время боя знает сама комната. */
export type FightStateDraft = Omit<FightState, 'title' | 'updatedAt'>;
