import type {
  APPLY_SOURCES,
  GAME_COST_TYPES,
  GAME_DURATION_TYPES,
  GAME_SESSION_STATUSES,
  GAME_STATUSES,
  GAME_SYSTEMS,
  GAME_TYPES,
  GAME_VISIBILITIES,
  NOTIFICATION_TYPES,
  PROFILE_GENDERS,
  REGISTRATION_DECISIONS,
  REVIEW_KINDS,
  SESSION_ATTENDANCE_STATUSES,
  SESSION_PAYMENT_TYPES,
  SESSION_REGISTRATION_STATUSES,
  SESSION_TIMELINE_SCALES,
  SESSION_WEEKDAYS,
} from './constants';

export type GameSystem = (typeof GAME_SYSTEMS)[number];
export type GameType = (typeof GAME_TYPES)[number];
export type GameDurationType = (typeof GAME_DURATION_TYPES)[number];
export type GameCostType = (typeof GAME_COST_TYPES)[number];
export type GameVisibility = (typeof GAME_VISIBILITIES)[number];
export type GameStatus = (typeof GAME_STATUSES)[number];
export type GameSessionStatus = (typeof GAME_SESSION_STATUSES)[number];
export type SessionPaymentType = (typeof SESSION_PAYMENT_TYPES)[number];
export type ProfileGender = (typeof PROFILE_GENDERS)[number];
export type RegistrationDecision = (typeof REGISTRATION_DECISIONS)[number];
export type SessionTimelineScale = (typeof SESSION_TIMELINE_SCALES)[number];
export type SessionWeekday = (typeof SESSION_WEEKDAYS)[number];

export type SessionRegistrationStatus =
  (typeof SESSION_REGISTRATION_STATUSES)[number];

export type SessionAttendanceStatus =
  (typeof SESSION_ATTENDANCE_STATUSES)[number];

/** Город из справочника сервиса. */
export interface CityOption {
  name: string;
  /** Область или штат; `null` — город известен без уточнения. */
  region: string | null;
  country: string;
}

/**
 * Мастер глазами того, кто выбирает игру: что он о себе написал и что у него
 * было раньше.
 */
export interface MasterPublicProfile {
  userId: string;

  /** Рассказ о себе; `null` — мастер его не писал. */
  about: string | null;

  /** Стаж за столом, лет; `null` — не указан. */
  tabletopExperienceYears: number | null;
  recruitingGames: number;
  closedGames: number;
  cancelledGames: number;
  completedSessions: number;

  /** Сколько игроков сыграли бы с ним снова. */
  recommended: number;

  /** Сколько всего раскрытых оценок. */
  reviews: number;
}

/** Кто кого оценил: игрок мастера или мастер игрока. */
export type ReviewKind = (typeof REVIEW_KINDS)[number];

/**
 * Вердикт одного участника встречи о другом.
 *
 * Оценка бинарная — «сыграл бы снова» или нет: на малых числах это честнее
 * пятизвёздочной шкалы, которая быстро схлопывается в сплошные пятёрки.
 */
export interface SessionReview {
  id: string;
  sessionId: string;
  gameId: string;
  authorId: string;
  targetId: string;
  kind: ReviewKind;
  recommended: boolean;

  /** Текст отзыва; `null` — оценку поставили молча. */
  comment: string | null;
  createdAt: string;
}

/**
 * Отметка в своём списке: отмеченный мастер или отмеченный игрок.
 *
 * Имени здесь нет — сервис поиска игр знает только идентификатор, а имена
 * принадлежат core-api.
 */
export interface Follow {
  userId: string;
  createdAt: string;
}

/** Репутация участника: сколько людей сыграли бы с ним снова. */
export interface Reputation {
  userId: string;
  recommended: number;
  total: number;
}

/** Тело оценки участника встречи. */
export interface CreateSessionReviewRequest {
  targetId: string;
  recommended: boolean;
  comment?: string;
}

/** Игра из выдачи find-game-api. */
export interface Game {
  id: string;
  masterId: string;
  title: string;
  system: GameSystem;
  imageUrl: string | null;
  virtualTableUrl: string | null;

  /** Разговор с мастером: открыт всем, кто смотрит объявление. */
  masterChatUrl: string | null;

  /**
   * Чат самой игры. Приходит только мастеру и принятым игрокам — остальным
   * его не отдаёт сервис, поэтому здесь он просто пуст.
   */
  gameChatUrl: string | null;
  genre: string | null;
  description: string;
  requirements: string;
  allowedSources: Array<string>;
  type: GameType;
  city: string | null;

  /** Где именно собираются: клуб, антикафе, чей-то стол. Только у офлайна. */
  venue: string | null;
  playersToStart: number;
  maxPlayers: number;
  /**
   * Сколько мест занято в ближайшей предстоящей сессии. Место занимает любая
   * неотклонённая заявка, включая ещё не разобранную мастером.
   */
  takenSeats: number;
  /**
   * Сколько из занятых мест подтвердил мастер. Разница с `takenSeats` —
   * заявки, которые он ещё не разобрал.
   */
  approvedSeats: number;
  minAge: number | null;
  maxAge: number | null;
  startingLevel: number;
  crossplayAllowed: boolean;
  status: GameStatus;

  /**
   * Мастер закрыл набор досрочно. Полный стол закрыт и без этой отметки: там
   * нет свободного места.
   */
  recruitmentClosed: boolean;
  durationType: GameDurationType;
  costType: GameCostType;
  visibility: GameVisibility;
  /**
   * Код приглашения. Публичные ответы его вырезают — он приходит только при
   * создании игры и в собственной выдаче мастера.
   */
  inviteCode: string | null;
  createdAt: string;
  /**
   * Позиция в публичном списке: по ней сервис сортирует выдачу, и она же
   * задаёт отсчёт до следующего поднятия. Отсутствует на сборках сервиса
   * без поднятия игр.
   */
  listPositionAt: string | null;
  updatedAt: string;
}

/** Страница Spring-пагинации. */
export interface SpringPage<Item> {
  content: Array<Item>;
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Фильтр каталога. Категориальные фильтры — множественные, у каждого есть
 * исключающая пара; возраст и кроссплей — одиночные.
 */
export interface GameSearchFilter {
  system: Array<GameSystem>;
  excludeSystem: Array<GameSystem>;
  type: Array<GameType>;
  excludeType: Array<GameType>;
  durationType: Array<GameDurationType>;
  excludeDurationType: Array<GameDurationType>;
  costType: Array<GameCostType>;
  excludeCostType: Array<GameCostType>;
  status: Array<GameStatus>;
  excludeStatus: Array<GameStatus>;
  city: Array<string>;
  excludeCity: Array<string>;
  crossplayAllowed: boolean | null;
  minAge: number | null;
  maxAge: number | null;
}

/**
 * Выбор по одному категориальному фильтру: что искать и что исключить.
 *
 * Обе половины живут одним значением намеренно. Нажатие на чип меняет их
 * вместе (значение переезжает из «нужно» в «не нужно»), а два раздельных
 * `v-model` в одном такте теряют одно из обновлений: пропсы к дочернему
 * компоненту доезжают только на следующем рендере, и вторая запись
 * перетирает первую.
 */
export interface FilterSelection {
  included: Array<string>;
  excluded: Array<string>;
}

/** Тело создания игры — повторяет `CreateGameRequest` сервиса. */
export interface CreateGameRequest {
  title: string;
  system: GameSystem;
  imageUrl?: string;
  virtualTableUrl?: string;
  masterChatUrl?: string;
  gameChatUrl?: string;
  genre?: string;
  description: string;
  requirements: string;
  allowedSources?: Array<string>;
  type: GameType;
  city?: string;
  venue?: string;
  playersToStart: number;
  maxPlayers: number;
  minAge?: number;
  maxAge?: number;
  startingLevel: number;
  crossplayAllowed: boolean;
  durationType: GameDurationType;
  costType: GameCostType;
  visibility: GameVisibility;
}

/**
 * Тело изменения игры. Совпадает с созданием: форма редактирования та же, и
 * правила у неё те же. Статус так не меняется — для завершения отдельный метод.
 */
export type UpdateGameRequest = CreateGameRequest;

/** Состояние формы создания игры: пустые поля живут как `null`. */
export interface GameFormState {
  title: string;
  system: GameSystem;
  imageUrl: string;
  virtualTableUrl: string;
  masterChatUrl: string;
  gameChatUrl: string;
  genre: string;
  description: string;
  requirements: string;
  allowedSources: Array<string>;
  type: GameType;
  city: string;
  venue: string;
  playersToStart: number;
  maxPlayers: number;
  minAge: number | null;
  maxAge: number | null;
  startingLevel: number;
  crossplayAllowed: boolean;
  durationType: GameDurationType;
  costType: GameCostType;
  visibility: GameVisibility;
}

/** Сессия игры. */
export interface GameSession {
  id: string;
  gameId: string;
  title: string;
  /**
   * Начало сессии. Пусто у набора с открытой датой: мастер назначает время
   * после того, как соберёт игроков.
   */
  startsAt: string | null;
  estimatedDurationMinutes: number | null;
  status: GameSessionStatus;
  priceAmount: number | null;
  priceCurrency: string | null;
  paymentType: SessionPaymentType | null;

  /**
   * Когда мастер закрыл встречу. От неё считается окно на оценку; `null` —
   * встреча ещё не завершена или закрыта до появления оценок.
   */
  completedAt: string | null;
  registeredPlayerIds: Array<string>;
}

/** Тело создания сессии. */
export interface CreateGameSessionRequest {
  title: string;
  startsAt: string;
  estimatedDurationMinutes?: number;
  priceAmount?: number;
  priceCurrency?: string;
  paymentType?: SessionPaymentType;
}

/**
 * Серия встреч по расписанию: «по средам и пятницам в 19:00 до конца ноября».
 *
 * Горизонт задаётся конечной датой: «десять недель» и «два месяца» мастер
 * называет в форме, а сервису уходит уже посчитанный день.
 */
export interface CreateGameSessionSeriesRequest {
  title: string;
  /** Первый день, с которого искать подходящие дни недели, `YYYY-MM-DD`. */
  startsOn: string;
  /** Последний день серии включительно, `YYYY-MM-DD`. */
  until: string;
  /** Дни недели по ISO: понедельник — `MONDAY`. */
  daysOfWeek: Array<SessionWeekday>;
  /** Время начала в поясе мастера, `HH:mm`. */
  timeOfDay: string;
  /** Пояс мастера из IANA: «19:00 по средам» не должно ехать по сезонам. */
  zoneId: string;
  estimatedDurationMinutes?: number;
  priceAmount?: number;
  priceCurrency?: string;
  paymentType?: SessionPaymentType;
}

/** Тело копирования сессии: и название, и дата необязательны. */
export interface CopyGameSessionRequest {
  title?: string;
  /** Без даты копия объявляется набором с открытой датой. */
  startsAt?: string;
}

/** Состояние формы сессии. */
export interface SessionFormState {
  title: string;
  startsAt: string;
  /** Набор с открытой датой — время назначается после сбора игроков. */
  /** Сессия платной игры, проводимая бесплатно. */
  isFree: boolean;
  estimatedDurationMinutes: number | null;
  priceAmount: number | null;
  priceCurrency: string;
  paymentType: SessionPaymentType | null;
}

/**
 * Как игрок представляет персонажа в заявке: своим листом с сайта, чужой
 * ссылкой или просто именем.
 */
export type ApplySource = (typeof APPLY_SOURCES)[number];

/** Тело заявки: оба поля необязательны и независимы. */
export interface CreateGameRegistrationRequest {
  characterSheetUrl?: string;
  characterName?: string;
}

/**
 * Заявка игрока в игру.
 *
 * Одна на игру, а не на каждую сессию: принятый игрок входит в состав и
 * попадает во все запланированные встречи, включая созданные позже.
 */
export interface GameRegistration {
  id: string;
  gameId: string;
  playerId: string;
  characterSheetUrl: string | null;
  /** Имя персонажа: игрок называет его, когда листа на сайте нет. */
  characterName: string | null;
  status: SessionRegistrationStatus;
  /**
   * Причина отказа, если мастер её назвал. Объяснять он не обязан, но когда
   * объясняет, игрок должен это увидеть — иначе отказ выглядит молчанием.
   */
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Участие игрока в сессии: только то, что относится к самой встрече. Состав
 * определяет заявка в игру, поэтому статуса здесь нет.
 */
export interface SessionParticipant {
  id: string;
  sessionId: string;
  playerId: string;
  attendanceStatus: SessionAttendanceStatus | null;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Профиль поиска игр: общая часть и две независимые анкеты. */
export interface FindGameUserProfile {
  userId: string;
  birthYear: number | null;
  gender: ProfileGender | null;
  tabletopExperienceYears: number | null;
  masterAbout: string;
  playerAbout: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Тело обновления профиля. Анкеты Мастера и Игрока независимы, но сервис
 * принимает их только вместе, поэтому обе всегда есть в запросе.
 */
export interface UpdateFindGameProfileRequest {
  birthYear: number | null;
  gender: ProfileGender;
  tabletopExperienceYears: number | null;
  master: { about: string };
  player: { about: string };
}

/** Состояние формы профиля. */
export interface FindGameProfileFormState {
  birthYear: number | null;
  gender: ProfileGender;
  tabletopExperienceYears: number | null;
  masterAbout: string;
  playerAbout: string;
}

/** RFC 7807 ProblemDetail сервиса. */
export interface FindGameProblemDetail {
  type: string | null;
  title: string | null;
  status: number | null;
  detail: string | null;
  /** Пофайловые ошибки валидации: `{ поле: сообщение }`. */
  errors: Record<string, string> | null;
  /** Время следующего поднятия игры — приходит только в отказе 429. */
  availableAt: string | null;
}

/** Роль текущего пользователя относительно конкретной игры. */
export type GameViewerRole = 'guest' | 'master' | 'player' | 'visitor';

/** Что текущему пользователю доступно на странице игры. */
export interface GameViewerAbilities {
  role: GameViewerRole;
  /** Мастер-владелец игры. */
  isMaster: boolean;
  /** Заявка в игру принята мастером. */
  isApprovedPlayer: boolean;
  /** Мастер может править свою игру. */
  canEditGame: boolean;
  canCreateSession: boolean;
  canCopySession: boolean;
  canReviewRegistrations: boolean;
  canManagePayments: boolean;
  canCloseGame: boolean;
  /** Мастер может отметить игру несостоявшейся. */
  canCancelGame: boolean;
  /** Мастер может закрыть набор досрочно: группа собрана, места ещё есть. */
  canCloseRecruitment: boolean;

  /** Мастер может открыть набор снова: свободное место есть. */
  canOpenRecruitment: boolean;
  canRaiseGame: boolean;
  canDeleteGame: boolean;
  /** Можно подать заявку: игрок вошёл, не мастер и ещё не подавал. */
  canApply: boolean;
  /** Можно отозвать свою неразобранную заявку. */
  canWithdraw: boolean;
  /** Заявка подана и ждёт решения мастера. */
  isPending: boolean;
  /** Заявка отклонена мастером. */
  isRejected: boolean;
  /** Нужно войти, чтобы что-то делать в этой игре. */
  needsSignIn: boolean;
}

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Уведомление ленты. Названия игры и сессии сервис хранит копией, поэтому
 * лента читается без дополнительных запросов.
 */
export interface FindGameNotification {
  id: string;
  type: NotificationType;
  gameId: string;
  gameTitle: string;
  sessionId: string | null;
  sessionTitle: string | null;
  /** Время прочтения; `null` — ещё не прочитано. */
  readAt: string | null;
  createdAt: string;
}

/** Отображаемое имя участника. */
export interface ParticipantName {
  userId: string;
  displayName: string;
}
