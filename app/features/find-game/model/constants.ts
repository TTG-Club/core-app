import { FIND_GAME_API_PREFIX } from '#shared/consts';

/* ------------------------------------------------------------------ */
/* Маршруты сайта                                                      */
/* ------------------------------------------------------------------ */

/** Каталог игр. */
export const GAMES_ROUTE = '/games';

/** Создание игры мастером. */
export const GAMES_CREATE_ROUTE = '/games/create';

/** Свои игры мастера. */
export const GAMES_MY_ROUTE = '/games/my';

/** Профиль поиска игр во вкладках профиля пользователя. */
export const FIND_GAME_PROFILE_ROUTE = '/user/profile/find-game';

/** Раздел, под которым каталог живёт в навигации. */
export const GAMES_NAVIGATION_LABEL = 'Поиск игр';

/** Пункт каталога внутри раздела навигации. */
export const GAMES_CATALOG_NAVIGATION_LABEL = 'Каталог игр';

export const GAMES_CREATE_NAVIGATION_LABEL = 'Создать игру';

export const GAMES_MY_NAVIGATION_LABEL = 'Мои игры';

export const FIND_GAME_PROFILE_NAVIGATION_LABEL = 'Игровой профиль';

/* ------------------------------------------------------------------ */
/* Пути API                                                            */
/* ------------------------------------------------------------------ */

/** Базовый путь игр внутри same-origin прокси сайта. */
export const GAMES_API_PATH = `${FIND_GAME_API_PREFIX}/games`;

/** Профиль Мастера и Игрока. */
export const FIND_GAME_PROFILE_API_PATH = `${FIND_GAME_API_PREFIX}/profiles/me`;

/** Публичный профиль мастера: его читают прямо с карточки игры. */
export const MASTER_PROFILE_API_PATH = `${FIND_GAME_API_PREFIX}/profiles/masters`;

/** Справочник городов: подсказки для поля города и фильтра каталога. */
export const CITIES_API_PATH = `${FIND_GAME_API_PREFIX}/cities`;

export const NOTIFICATIONS_API_PATH = `${FIND_GAME_API_PREFIX}/notifications`;

/** Резолв «UUID -> отображаемое имя» в core-api. */
export const DISPLAY_NAMES_BY_IDS_API_PATH = '/api/user/display-names/by-ids';

/**
 * Поиск источников сайта — тот же, что у раздела «Источники». Своего
 * справочника книг у find-game-api нет и не нужно: они принадлежат core-api.
 */
export const SOURCES_SEARCH_PATH = '/api/v2/source/search';

/** Своя репутация игрока: доля оценок без текстов и авторов. */
export const OWN_REPUTATION_API_PATH = `${FIND_GAME_API_PREFIX}/profiles/me/reputation`;

/** Отмеченные мастера: их новые игры приходят уведомлением. */
export const FOLLOWED_MASTERS_API_PATH = `${FIND_GAME_API_PREFIX}/profiles/me/follows/masters`;

/** Отмеченные игроки: их мастер зовёт в свои игры. */
export const BOOKMARKED_PLAYERS_API_PATH = `${FIND_GAME_API_PREFIX}/profiles/me/follows/players`;

/** Отметка о конкретном игроке. */
export const PLAYER_BOOKMARK_API_PATH = `${FIND_GAME_API_PREFIX}/profiles/players`;

/* ------------------------------------------------------------------ */
/* Перечисления сервиса                                                */
/* ------------------------------------------------------------------ */

export const GAME_SYSTEMS = ['DND_2024', 'DND_2014'] as const;

export const GAME_TYPES = ['ONLINE', 'TEXT', 'OFFLINE'] as const;

export const GAME_DURATION_TYPES = ['ONE_SHOT', 'CAMPAIGN'] as const;

export const GAME_COST_TYPES = ['FREE', 'PAID'] as const;

export const GAME_VISIBILITIES = ['PUBLIC', 'PRIVATE'] as const;

// CANCELLED — отдельный исход, а не разновидность завершения: по завершённым
// видно, что было сыграно, и несостоявшимся среди них не место.
export const GAME_STATUSES = ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'] as const;

export const GAME_SESSION_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const SESSION_REGISTRATION_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;

export const SESSION_ATTENDANCE_STATUSES = [
  'ATTENDING',
  'NOT_ATTENDING',
] as const;

export const SESSION_PAYMENT_TYPES = ['PREPAYMENT', 'POSTPAYMENT'] as const;

/** Условие оплаты по умолчанию: за столом чаще собирают после игры. */
export const SESSION_DEFAULT_PAYMENT_TYPE = 'POSTPAYMENT';

/** Дни недели серии в порядке недели: сервис ждёт имена `DayOfWeek`. */
export const SESSION_WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const SESSION_WEEKDAY_LABELS = {
  MONDAY: 'Пн',
  TUESDAY: 'Вт',
  WEDNESDAY: 'Ср',
  THURSDAY: 'Чт',
  FRIDAY: 'Пт',
  SATURDAY: 'Сб',
  SUNDAY: 'Вс',
} as const;

/**
 * Виды уведомлений. Текст собирает интерфейс: сервис присылает только повод,
 * названия игры и сессии.
 */
export const NOTIFICATION_TYPES = [
  'REGISTRATION_SUBMITTED',
  'REGISTRATION_APPROVED',
  'SESSION_SCHEDULED',
  'SESSION_STARTED',
  'SESSION_COMPLETED',
  'SESSION_CANCELLED',
  'MASTER_PUBLISHED_GAME',
  'GAME_INVITE',
] as const;

export const NOTIFICATION_TEXTS = {
  SESSION_CANCELLED: 'Сессия отменена',
  REGISTRATION_SUBMITTED: 'Новая заявка в сессию',
  REGISTRATION_APPROVED: 'Заявка принята',
  SESSION_SCHEDULED: 'Назначена дата сессии',
  SESSION_STARTED: 'Сессия началась',
  SESSION_COMPLETED: 'Сессия завершена',
  MASTER_PUBLISHED_GAME: 'Отмеченный мастер объявил игру',
  GAME_INVITE: 'Мастер зовёт вас в игру',
} as const;

export const NOTIFICATION_ICONS = {
  SESSION_CANCELLED: 'tabler:calendar-x',
  REGISTRATION_SUBMITTED: 'tabler:user-plus',
  REGISTRATION_APPROVED: 'tabler:user-check',
  SESSION_SCHEDULED: 'tabler:calendar-check',
  SESSION_STARTED: 'tabler:player-play',
  SESSION_COMPLETED: 'tabler:flag-check',
  MASTER_PUBLISHED_GAME: 'tabler:bookmark',
  GAME_INVITE: 'tabler:mail',
} as const;

export const NOTIFICATIONS_TITLE = 'Уведомления';
export const NOTIFICATIONS_EMPTY_TITLE = 'Уведомлений нет';

export const NOTIFICATIONS_EMPTY_DESCRIPTION =
  'Здесь появятся заявки в ваши сессии и новости игр, в которые вас приняли.';

export const NOTIFICATIONS_READ_ALL_LABEL = 'Прочитать всё';
export const NOTIFICATIONS_PAGE_SIZE = 30;

export const PROFILE_GENDERS = [
  'MALE',
  'FEMALE',
  'OTHER',
  'NOT_SPECIFIED',
] as const;

export const REGISTRATION_DECISIONS = ['APPROVE', 'REJECT'] as const;

/* ------------------------------------------------------------------ */
/* Подписи перечислений                                                */
/* ------------------------------------------------------------------ */

export const GAME_SYSTEM_LABELS = {
  DND_2024: 'D&D 5 (2024)',
  DND_2014: 'D&D 5 (2014)',
} as const;

export const GAME_TYPE_LABELS = {
  ONLINE: 'Онлайн',
  TEXT: 'Текстовая',
  OFFLINE: 'Вживую',
} as const;

export const GAME_TYPE_ICONS = {
  ONLINE: 'tabler:device-desktop',
  TEXT: 'tabler:message-2',
  OFFLINE: 'tabler:users-group',
} as const;

export const GAME_DURATION_TYPE_LABELS = {
  ONE_SHOT: 'Ваншот',
  CAMPAIGN: 'Кампания',
} as const;

export const GAME_COST_TYPE_LABELS = {
  FREE: 'Бесплатно',
  PAID: 'Платно',
} as const;

export const GAME_VISIBILITY_LABELS = {
  PUBLIC: 'Публичная',
  PRIVATE: 'По приглашению',
} as const;

export const GAME_STATUS_LABELS = {
  DRAFT: 'Черновик',
  OPEN: 'Набор открыт',
  CLOSED: 'Завершена',
  CANCELLED: 'Отменена',
} as const;

export const GAME_SESSION_STATUS_LABELS = {
  SCHEDULED: 'Запланирована',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
} as const;

export const SESSION_REGISTRATION_STATUS_LABELS = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Принята',
  REJECTED: 'Отклонена',
} as const;

export const SESSION_ATTENDANCE_STATUS_LABELS = {
  ATTENDING: 'Буду',
  NOT_ATTENDING: 'Не буду',
} as const;

export const SESSION_PAYMENT_TYPE_LABELS = {
  PREPAYMENT: 'Предоплата',
  POSTPAYMENT: 'Постоплата',
} as const;

export const PROFILE_GENDER_LABELS = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  OTHER: 'Другой',
  NOT_SPECIFIED: 'Не указан',
} as const;

/** Цвета статусов и решений — берутся семантические, без палитры Tailwind. */
export const GAME_STATUS_COLORS = {
  DRAFT: 'neutral',
  OPEN: 'success',
  CLOSED: 'neutral',
  CANCELLED: 'error',
} as const;

export const GAME_SESSION_STATUS_COLORS = {
  SCHEDULED: 'primary',
  IN_PROGRESS: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
} as const;

/** Значок состояния на оси расписания: в кружке метки подписи не поместится. */
export const GAME_SESSION_STATUS_ICONS = {
  SCHEDULED: 'tabler:calendar-event',
  IN_PROGRESS: 'tabler:player-play',
  COMPLETED: 'tabler:flag-check',
  CANCELLED: 'tabler:calendar-x',
} as const;

/**
 * Цвет метки на оси расписания. Значки в кружках мелкие, и одной формой
 * состояния не различить — цвет читается раньше значка: идущая встреча
 * зелёная, отменённая красная, сыгранная гаснет до серой.
 */
export const GAME_SESSION_STATUS_TIMELINE_CLASSES = {
  SCHEDULED: 'bg-primary text-inverted',
  IN_PROGRESS: 'bg-success text-inverted',
  COMPLETED: 'bg-elevated text-muted',
  CANCELLED: 'bg-error text-inverted',
} as const;

/**
 * Ореол вокруг ближайшей запланированной встречи. Цвет метки занят её
 * состоянием, поэтому «следующая по расписанию» отмечается формой.
 */
export const SESSION_TIMELINE_NEAREST_CLASSES = 'ring-4 ring-primary/40';

export const SESSION_REGISTRATION_STATUS_COLORS = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
} as const;

/* ------------------------------------------------------------------ */
/* Ограничения полей (совпадают с валидацией find-game-api)            */
/* ------------------------------------------------------------------ */

export const GAME_TITLE_MAX_LENGTH = 150;
export const GAME_URL_MAX_LENGTH = 2048;
export const GAME_GENRE_MAX_LENGTH = 100;
export const GAME_DESCRIPTION_MAX_LENGTH = 20_000;
export const GAME_REQUIREMENTS_MAX_LENGTH = 10_000;
export const GAME_CITY_MAX_LENGTH = 120;
export const GAME_VENUE_MAX_LENGTH = 300;
export const GAME_ALLOWED_SOURCE_MAX_LENGTH = 120;
export const GAME_ALLOWED_SOURCES_MAX_COUNT = 50;
export const GAME_PLAYERS_MIN = 1;

/**
 * Предел стола. Сервис проверяет его по подписке — без неё пять игроков, с
 * ней пятнадцать; поле пускает до верхней границы, а решает сервис: знать о
 * чужой подписке форме игры незачем.
 */
export const GAME_PLAYERS_MAX = 15;
export const GAME_PLAYERS_FREE_MAX = 5;
export const GAME_AGE_MIN = 0;
export const GAME_AGE_MAX = 120;
export const GAME_STARTING_LEVEL_MIN = 1;
export const GAME_STARTING_LEVEL_MAX = 20;
export const GAME_DELETION_REASON_MAX_LENGTH = 1000;

export const SESSION_TITLE_MAX_LENGTH = 150;
export const SESSION_PRICE_MIN = 0.01;
export const SESSION_CURRENCY_PATTERN = /^[A-Z]{3}$/;
export const CHARACTER_SHEET_URL_MAX_LENGTH = 2048;
export const CHARACTER_NAME_MAX_LENGTH = 100;

export const PROFILE_BIRTH_YEAR_MIN = 1900;
export const PROFILE_BIRTH_YEAR_MAX = 2100;
export const PROFILE_EXPERIENCE_MIN = 0;
export const PROFILE_EXPERIENCE_MAX = 100;
export const PROFILE_ABOUT_MAX_LENGTH = 5000;
/* ------------------------------------------------------------------ */
/* Размеры страниц и лимиты запросов                                   */
/* ------------------------------------------------------------------ */

/**
 * Двенадцать игр на страницу. Число делится на любое количество колонок
 * сетки — 1, 2, 3 и 4, — поэтому последняя строка каталога полная на любой
 * ширине экрана. Меняя размер страницы, держите его кратным всем ступеням
 * `GAME_CATALOG_GRID_COLUMNS`, иначе строка снова станет рваной.
 */
export const GAME_CATALOG_PAGE_SIZE = 12;
export const GAME_CATALOG_GRID_COLUMNS = 4;
export const GAME_CATALOG_SKELETON_COUNT = GAME_CATALOG_PAGE_SIZE;
export const MY_GAMES_PAGE_SIZE = GAME_CATALOG_PAGE_SIZE;

/**
 * Сколько значков помещается в карточку каталога. Карточка одной высоты у
 * всех игр, и на значки в ней отведено ровно две строки; остальное мастер
 * и игрок видят на странице игры.
 */
export const GAME_CARD_BADGE_LIMIT = 4;

/**
 * До скольких мест занятость рисуется значками игроков. Дальше значки
 * перестают читаться, и остаётся только счётчик.
 */
export const GAME_SEATS_MAX_ICONS = 8;

/** Максимум идентификаторов в одном запросе отображаемых имён (лимит core-api). */
export const DISPLAY_NAMES_LOOKUP_MAX = 200;

/* ------------------------------------------------------------------ */
/* Чат: подключение и поведение ленты                                  */
/* ------------------------------------------------------------------ */

/** Задержка первой попытки переподключения SSE, мс. */

/** Потолок задержки переподключения, мс: дальше расти нет смысла. */

/** Сколько попыток переподключения делаем, прежде чем сдаться и ждать команды. */

/**
 * Насколько близко к концу ленты должен быть пользователь, чтобы новое событие
 * прокрутило список само. Дальше — не трогаем прокрутку и показываем счётчик
 * непрочитанных.
 */

/** Разрыв между сообщениями одного автора, после которого группа начинается заново, мс. */

/* ------------------------------------------------------------------ */
/* Тексты интерфейса                                                   */
/* ------------------------------------------------------------------ */

export const FIND_GAME_UNKNOWN_ERROR_MESSAGE =
  'Что-то пошло не так. Попробуйте ещё раз.';

export const PROFILE_SAVED_TITLE = 'Профиль сохранён';

export const PROFILE_SAVE_ERROR_TITLE = 'Не удалось сохранить профиль';

export const PROFILE_UNSAVED_TITLE = 'Несохранённые изменения';

export const PROFILE_UNSAVED_CONFIRM =
  'В профиле есть несохранённые изменения. Если уйти сейчас, они пропадут.';

export const PROFILE_LEAVE_LABEL = 'Уйти без сохранения';

export const FIND_GAME_FORBIDDEN_MESSAGE =
  'У вас нет доступа к этому разделу игры.';

export const FIND_GAME_NOT_FOUND_MESSAGE =
  'Игра не найдена или доступна только по приглашению.';

/** Имя-заглушка, когда core-api не вернул отображаемое имя участника. */
export const UNKNOWN_PARTICIPANT_NAME = 'Участник';

/** Подпись разрешённого кроссплея в списке признаков игры. */
export const GAME_CROSSPLAY_LABEL = 'Кросспол';

/** Подпись кнопки перехода к странице игры. */
export const GAME_OPEN_LABEL = 'Открыть игру';

/* Подсказки трёхпозиционного чипа фильтра. */
export const FILTER_CHIP_NEUTRAL_HINT = 'Не важно — нажмите, чтобы искать это';
export const FILTER_CHIP_INCLUDED_HINT = 'Ищем это — нажмите, чтобы исключить';
export const FILTER_CHIP_EXCLUDED_HINT = 'Исключено — нажмите, чтобы сбросить';

/* Подписи панели фильтров каталога. */
export const CATALOG_FILTERS_TITLE = 'Фильтры';
export const CATALOG_FILTERS_DESCRIPTION =
  'Нажимайте на значения: первое нажатие добавляет условие, второе — исключает.';
export const CATALOG_FILTERS_RESET_LABEL = 'Сбросить';
export const CATALOG_FILTERS_APPLY_LABEL = 'Показать игры';
export const CATALOG_FILTER_SYSTEM_LABEL = 'Система';
export const CATALOG_FILTER_TYPE_LABEL = 'Формат';
export const CATALOG_FILTER_DURATION_LABEL = 'Длительность';
export const CATALOG_FILTER_COST_LABEL = 'Стоимость';
export const CATALOG_FILTER_STATUS_LABEL = 'Статус набора';
export const CATALOG_FILTER_CITY_LABEL = 'Города';
export const CATALOG_FILTER_CITY_PLACEHOLDER = 'Город и Enter';
export const CATALOG_FILTER_CITY_EXCLUDE_LABEL = 'Исключить города';
export const CATALOG_FILTER_CROSSPLAY_LABEL = 'Кросспол';
export const CATALOG_FILTER_MIN_AGE_LABEL = 'Возраст от';
export const CATALOG_FILTER_MAX_AGE_LABEL = 'Возраст до';

/** Варианты трёхпозиционного выбора кроссплея. */
export const CROSSPLAY_FILTER_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: 'any', label: 'Не важно' },
  { value: 'allowed', label: 'Разрешён' },
  { value: 'forbidden', label: 'Запрещён' },
];

/* Подписи страницы игры. */
export const GAME_DESCRIPTION_TITLE = 'Описание';
export const GAME_REQUIREMENTS_TITLE = 'Требования к игрокам';
export const GAME_ALLOWED_SOURCES_TITLE = 'Допустимые источники';
export const GAME_VIRTUAL_TABLE_LABEL = 'Виртуальный стол';
export const GAME_MASTER_LABEL = 'Мастер';

/* Профиль мастера. */
export const MASTER_PROFILE_TITLE = 'Профиль мастера';
export const MASTER_PROFILE_ABOUT_EMPTY = 'Мастер о себе пока не рассказал';
export const MASTER_PROFILE_EXPERIENCE_LABEL = 'За столом';
export const MASTER_PROFILE_RECRUITING_LABEL = 'В наборе';
export const MASTER_PROFILE_CLOSED_LABEL = 'Завершено игр';
export const MASTER_PROFILE_CANCELLED_LABEL = 'Отменено игр';
export const MASTER_PROFILE_SESSIONS_LABEL = 'Проведено встреч';
export const MASTER_PROFILE_ERROR_TITLE = 'Не удалось загрузить профиль';
export const MASTER_PROFILE_OPEN_HINT = 'Открыть профиль мастера';
export const MASTER_PROFILE_REVIEWS_TITLE = 'Отзывы игроков';

/* ------------------------------------------------------------------ */
/* Отметки участников                                                  */
/* ------------------------------------------------------------------ */

export const FOLLOW_MASTER_LABEL = 'Отслеживать';
export const FOLLOW_MASTER_ACTIVE_LABEL = 'Отслеживаю';

export const FOLLOW_MASTER_HINT =
  'Новые игры этого мастера будут приходить уведомлением';

export const FOLLOW_MASTER_ADDED_TOAST = 'Мастер отмечен';
export const FOLLOW_MASTER_REMOVED_TOAST = 'Отметка снята';

export const BOOKMARK_PLAYER_LABEL = 'Отметить игрока';
export const BOOKMARK_PLAYER_ACTIVE_LABEL = 'Отмечен';

export const BOOKMARK_PLAYER_HINT =
  'Отмеченного игрока можно позвать в следующую игру';

export const BOOKMARK_PLAYER_ADDED_TOAST = 'Игрок отмечен';
export const BOOKMARK_PLAYER_REMOVED_TOAST = 'Отметка снята';

export const FOLLOWED_MASTERS_TAB_LABEL = 'Мои мастера';
export const BOOKMARKED_PLAYERS_TAB_LABEL = 'Мои игроки';
export const MY_GAMES_TAB_LABEL = 'Игры';

export const FOLLOWED_MASTERS_EMPTY_TITLE = 'Отмеченных мастеров нет';

export const FOLLOWED_MASTERS_EMPTY_DESCRIPTION =
  'Откройте профиль мастера в объявлении и отметьте его — новые игры придут уведомлением.';

export const BOOKMARKED_PLAYERS_EMPTY_TITLE = 'Отмеченных игроков нет';

export const BOOKMARKED_PLAYERS_EMPTY_DESCRIPTION =
  'Отметить игрока можно в заявках на вашу игру — потом его будет легко позвать в следующую.';

export const INVITE_PLAYER_LABEL = 'Позвать в игру';
export const INVITE_PLAYER_TITLE = 'Приглашение в игру';

export const INVITE_PLAYER_DESCRIPTION =
  'Игрок получит уведомление со ссылкой и подаст заявку сам.';

export const INVITE_GAME_LABEL = 'Игра';
export const INVITE_GAME_PLACEHOLDER = 'Выберите игру с открытым набором';
export const INVITE_SENT_TOAST = 'Приглашение отправлено';
export const INVITE_NO_GAMES_HINT = 'Нет игр с открытым набором';

/* ------------------------------------------------------------------ */
/* Оценки за встречу                                                   */
/* ------------------------------------------------------------------ */

/** Кто кого оценил: игрок мастера или мастер игрока. */
export const REVIEW_KINDS = ['MASTER_REVIEW', 'PLAYER_REVIEW'] as const;

/**
 * Сколько дней после встречи её можно оценить. Ровно столько же держит окно
 * сервис: позже он отвечает отказом.
 */
export const REVIEW_WINDOW_DAYS = 14;

export const REVIEW_COMMENT_MAX_LENGTH = 2000;

export const REVIEW_TITLE = 'Оценка встречи';
export const REVIEW_OPEN_LABEL = 'Оценить встречу';
export const REVIEW_SUBMIT_LABEL = 'Сохранить';
export const REVIEW_UP_LABEL = 'Сыграл бы снова';
export const REVIEW_DOWN_LABEL = 'Больше не сяду';
export const REVIEW_COMMENT_LABEL = 'Отзыв';
export const REVIEW_COMMENT_PLACEHOLDER = 'Необязательно: как прошла встреча';
export const REVIEW_SAVED_TOAST = 'Оценка сохранена';
export const REVIEW_VERDICT_REQUIRED = 'Выберите оценку';

/** Почему чужая оценка ещё не видна: пара раскрывается разом. */
export const REVIEW_HIDDEN_HINT =
  'Оценка второй стороны откроется, когда ответят оба';

export const REVIEW_WINDOW_HINT = `Оценить встречу можно в течение ${REVIEW_WINDOW_DAYS} дней после её завершения`;

export const REVIEW_EMPTY_PARTICIPANTS =
  'Во встрече не было других участников — оценивать некого';

export const REVIEWS_EMPTY_TITLE = 'Отзывов пока нет';

export const REVIEWS_EMPTY_DESCRIPTION =
  'Они появятся, когда игроки оценят проведённые встречи';

export const REPUTATION_EMPTY_LABEL = 'Пока без оценок';
export const REPUTATION_ERROR_LABEL = 'Репутация недоступна';
export const PLAYER_REPUTATION_LABEL = 'Репутация игрока';
export const PLAYER_REVIEWS_TITLE = 'Отзывы мастеров';
export const PLAYER_REVIEWS_OPEN_LABEL = 'Отзывы мастеров';
export const OWN_REPUTATION_TITLE = 'Ваша репутация игрока';

/**
 * Своя репутация показывается без текстов и авторов: игрок знает, где стоит,
 * но не идёт выяснять отношения с конкретным мастером.
 */
export const OWN_REPUTATION_HINT =
  'Мастера видят эту долю, когда разбирают вашу заявку. Кто именно и что написал — не показывается.';
export const GAME_SESSIONS_TITLE = 'Календарь сессий';

export const GAME_GUEST_NOTICE_TITLE = 'Войдите, чтобы участвовать';
export const GAME_GUEST_NOTICE_DESCRIPTION =
  'Список сессий, заявки и чат доступны после входа на сайт.';
export const GAME_SIGN_IN_LABEL = 'Войти';

export const GAME_INVITE_TITLE = 'Ссылка-приглашение';
export const GAME_INVITE_DESCRIPTION =
  'Приватную игру видно только по этой ссылке. Отправьте её игрокам.';
export const GAME_INVITE_COPY_LABEL = 'Скопировать ссылку';

export const GAME_CLOSE_LABEL = 'Завершить игру';
export const GAME_CLOSE_CONFIRM_TITLE = 'Завершить игру?';
export const GAME_CLOSE_CONFIRM_DESCRIPTION =
  'Игра получит статус «Завершена» и пропадёт из набора. Отменить это нельзя.';
export const GAME_CLOSED_TOAST = 'Игра завершена';

export const GAME_CANCEL_LABEL = 'Отменить игру';
export const GAME_CANCEL_CONFIRM_TITLE = 'Отменить игру?';

export const GAME_CANCEL_CONFIRM_DESCRIPTION =
  'Игра будет отмечена как несостоявшаяся, а её набор закроется. По завершённым играм видно, что мастер действительно провёл, поэтому отмена — отдельный исход. Вернуть игру в набор нельзя.';

export const GAME_CANCELLED_TOAST = 'Игра отменена';

/** Начало сообщения об исчерпанной норме попыток. */
export const RETRY_AFTER_PREFIX = 'Попробуйте снова через';

export const GAME_RAISE_LABEL = 'Поднять в каталоге';
export const GAME_RAISED_TOAST = 'Игра поднята в каталоге';

export const GAME_DELETE_LABEL = 'Скрыть игру';
export const GAME_DELETE_CONFIRM_TITLE = 'Скрыть игру?';
export const GAME_DELETE_CONFIRM_DESCRIPTION =
  'Игра исчезнет из поиска и станет недоступна по прямой ссылке и коду приглашения.';
export const GAME_DELETE_REASON_LABEL = 'Причина';
export const GAME_DELETE_REASON_PLACEHOLDER = 'Нарушение правил сообщества';
export const GAME_DELETED_TOAST = 'Игра скрыта';

export const CANCEL_LABEL = 'Отмена';
export const SAVE_LABEL = 'Сохранить';

/** Редактирование игры мастером. */
export const GAMES_EDIT_ROUTE_SUFFIX = 'edit';

/* Подписи формы создания и редактирования игры. */
export const GAME_FORM_TITLE = 'Новая игра';
export const GAME_FORM_EDIT_TITLE = 'Редактирование игры';
export const GAME_FORM_SUBMIT_LABEL = 'Опубликовать';
export const GAME_EDIT_LABEL = 'Редактировать';
export const GAME_FORM_CREATED_TOAST = 'Игра опубликована';
export const GAME_FORM_UPDATED_TOAST = 'Изменения сохранены';

/**
 * Подсказки к правилам, которых нет при создании: они защищают уже созданные
 * сессии и принятые заявки от рассинхронизации.
 */
export const GAME_EDIT_COST_LOCKED_HINT =
  'Платность нельзя изменить: у игры уже есть сессии с зафиксированными условиями оплаты.';

export const GAME_EDIT_VISIBILITY_HINT =
  'При переходе в приватную игру выдаётся новая ссылка-приглашение, при возврате в публичную прежняя перестаёт работать.';
export const GAME_FORM_MAIN_SECTION = 'Об игре';
export const GAME_FORM_FORMAT_SECTION = 'Формат и условия';
export const GAME_FORM_PLAYERS_SECTION = 'Игроки';

export const GAME_FIELD_TITLE_LABEL = 'Название';
export const GAME_FIELD_TITLE_PLACEHOLDER = 'Проклятие Страда';
export const GAME_FIELD_SYSTEM_LABEL = 'Система';
export const GAME_FIELD_GENRE_LABEL = 'Жанр';
export const GAME_FIELD_GENRE_PLACEHOLDER = 'Выберите или впишите свой';

export const GAME_FIELD_GENRE_HINT =
  'Можно выбрать из списка или вписать свой вариант';

/**
 * Жанры кампании из «Руководства Мастера» — раздел о жанрах фэнтези
 * (DMG, «Flavors of Fantasy»).
 *
 * Список не закрытый: сервис принимает у жанра любую строку до 100 символов,
 * и запирать мастера в перечисление значило бы придумать ограничение, которого
 * у контракта нет. Свой вариант всегда можно вписать.
 */
export const GAME_GENRE_SUGGESTIONS = [
  'Героическое фэнтези',
  'Меч и магия',
  'Эпическое фэнтези',
  'Мифическое фэнтези',
  'Тёмное фэнтези',
  'Интриги',
  'Детектив',
  'Плащ и шпага',
  'Война',
  'Уся',
] as const;
export const GAME_FIELD_IMAGE_LABEL = 'Обложка';

export const GAME_FIELD_IMAGE_HINT =
  'Эта картинка показывается в каталоге и на странице игры';

/** Раздел S3 для обложек игр — первый сегмент ключа объекта. */
export const GAME_IMAGE_SECTION = 'games';

/**
 * Максимальная длина короткой стороны обложки. Карточка каталога показывает
 * её в соотношении 16:9 небольшого размера, поэтому больше 1024 не нужно.
 */
export const GAME_IMAGE_MAX_SIZE = '1024';
export const GAME_FIELD_VIRTUAL_TABLE_LABEL = 'Виртуальный стол';
export const GAME_FIELD_VIRTUAL_TABLE_PLACEHOLDER =
  'https://vtt.example.org/games/curse-of-strahd';
export const GAME_FIELD_MASTER_CHAT_LABEL = 'Чат с мастером';
export const GAME_FIELD_MASTER_CHAT_HINT =
  'Ссылку видит любой, кто открыл объявление';
export const GAME_FIELD_MASTER_CHAT_PLACEHOLDER = 'https://t.me/master';
export const GAME_FIELD_GAME_CHAT_LABEL = 'Чат игры';
export const GAME_FIELD_GAME_CHAT_HINT =
  'Ссылку видят только принятые игроки: подавшему заявку она не откроется';
export const GAME_FIELD_GAME_CHAT_PLACEHOLDER = 'https://t.me/+strahd-party';

/* Набор в игру. */
export const GAME_RECRUITMENT_CLOSE_LABEL = 'Закрыть набор';
export const GAME_RECRUITMENT_OPEN_LABEL = 'Открыть набор';
export const GAME_RECRUITMENT_CLOSED_BADGE = 'Набор закрыт';
export const GAME_RECRUITMENT_FULL_BADGE = 'Мест нет';
export const GAME_RECRUITMENT_CLOSED_TOAST = 'Набор закрыт';
export const GAME_RECRUITMENT_OPENED_TOAST = 'Набор открыт';

/** Подпись ссылки на разговор в самом объявлении. */
export const GAME_MASTER_CHAT_LINK_LABEL = 'Написать мастеру';
export const GAME_CHAT_LINK_LABEL = 'Чат игры';

export const GAME_FIELD_DESCRIPTION_LABEL = 'Описание';
export const GAME_FIELD_DESCRIPTION_PLACEHOLDER =
  'О чём игра, какой тон и чего ждать игрокам.';
export const GAME_FIELD_REQUIREMENTS_LABEL = 'Требования к игрокам';
export const GAME_FIELD_REQUIREMENTS_PLACEHOLDER =
  '18+, стабильное участие по субботам.';
export const GAME_FIELD_SOURCES_LABEL = 'Допустимые источники';
export const GAME_SOURCES_TITLE = 'Источники';
export const GAME_SOURCES_PICK_LABEL = 'Выбрать источники';

export const GAME_SOURCES_EMPTY_LABEL = 'Не ограничены — подойдёт любая книга';
export const GAME_FIELD_TYPE_LABEL = 'Формат';
export const GAME_FIELD_CITY_LABEL = 'Город';
export const GAME_FIELD_CITY_PLACEHOLDER = 'Москва';
export const GAME_FIELD_CITY_HINT = 'Только для игр вживую.';
export const GAME_FIELD_VENUE_LABEL = 'Место проведения';
export const GAME_VENUE_LABEL = 'Место';
export const GAME_FIELD_VENUE_HINT = 'Клуб, антикафе или чей-то стол.';
export const GAME_FIELD_VENUE_PLACEHOLDER = 'Клуб «Кубик», Пятницкая 12';
export const GAME_FIELD_DURATION_LABEL = 'Длительность';
export const GAME_FIELD_COST_LABEL = 'Стоимость';
export const GAME_FIELD_COST_HINT =
  'Сумму и условия оплаты вы зададите у каждой сессии отдельно.';
export const GAME_FIELD_VISIBILITY_LABEL = 'Видимость';
export const GAME_FIELD_VISIBILITY_HINT =
  'Приватную игру видно только по ссылке-приглашению.';
export const GAME_FIELD_PLAYERS_TO_START_LABEL = 'Игроков для старта';
export const GAME_FIELD_MAX_PLAYERS_LABEL = 'Максимум игроков';
export const GAME_FIELD_MAX_PLAYERS_HINT = `До ${GAME_PLAYERS_FREE_MAX}, с подпиской — до ${GAME_PLAYERS_MAX}`;
export const GAME_FIELD_MIN_AGE_LABEL = 'Возраст от';
export const GAME_FIELD_MAX_AGE_LABEL = 'Возраст до';
export const GAME_FIELD_AGE_HINT = 'Обе границы необязательны.';
export const GAME_FIELD_STARTING_LEVEL_LABEL = 'Стартовый уровень';
export const GAME_FIELD_CROSSPLAY_LABEL = 'Разрешить персонажа другого пола';

export const GAME_FORM_PLAYERS_ERROR =
  'Для старта нужно не больше игроков, чем максимум';
export const GAME_FORM_AGE_ERROR =
  'Минимальный возраст не может превышать максимальный';
export const GAME_FORM_LIMIT_HINT =
  'Без подписки у мастера может быть только одна незавершённая игра. Завершите текущую или оформите подписку.';

/* Подписи раздела «Мои игры». */
// Список собирает и свои игры, и чужие, куда пользователь записался,
// поэтому пустой экран зовёт и создать стол, и найти чужой.
/** Отбор своих игр по состоянию: «все» — всё, кроме отменённых. */
/** Подсказка у пометки: почему в меню горит точка. */
export const MY_GAMES_UPDATES_HINT = 'Есть новости в ваших играх';

export const MY_GAMES_STATUS_ALL_LABEL = 'Активные';
export const MY_GAMES_STATUS_HINT =
  'Отменённые игры показываются только по отбору';

export const MY_GAMES_EMPTY_TITLE = 'Пока ни одной игры';
export const MY_GAMES_EMPTY_DESCRIPTION =
  'Опубликуйте свою игру или подайте заявку в чужую — она появится здесь.';
export const MY_GAMES_ERROR_TITLE = 'Не удалось загрузить ваши игры';

/* Подписи профиля поиска игр. */
export const PROFILE_TITLE = 'Игровой профиль';
export const PROFILE_COMMON_SECTION = 'Общее';
export const PROFILE_MASTER_SECTION = 'Анкета Мастера';
export const PROFILE_PLAYER_SECTION = 'Анкета Игрока';
export const PROFILE_BIRTH_YEAR_LABEL = 'Год рождения';
export const PROFILE_GENDER_LABEL = 'Пол';
export const PROFILE_EXPERIENCE_LABEL = 'Опыт в НРИ, лет';
export const PROFILE_MASTER_ABOUT_LABEL = 'О себе как о Мастере';
export const PROFILE_MASTER_ABOUT_PLACEHOLDER = 'Вожу сюжетные кампании';
export const PROFILE_PLAYER_ABOUT_LABEL = 'О себе как об Игроке';
export const PROFILE_PLAYER_ABOUT_PLACEHOLDER = 'Люблю исследование и отыгрыш';
export const PROFILE_ABOUT_HINT = 'Анкеты Мастера и Игрока независимы.';
export const PROFILE_DIRTY_HINT = 'Есть несохранённые изменения.';
export const PROFILE_RESET_LABEL = 'Отменить изменения';
export const PROFILE_ERROR_TITLE = 'Не удалось загрузить профиль';

/* Подписи сессий. */
export const SESSION_CREATE_LABEL = 'Новая сессия';
export const SESSION_SERIES_LABEL = 'Серия сессий';
export const SESSION_SERIES_TITLE = 'Серия сессий по расписанию';
export const SESSION_SERIES_DESCRIPTION =
  'Кампания идёт неделями: выберите дни, время и до какого срока продолжать.';
export const SESSION_SERIES_WEEKDAYS_LABEL = 'Дни недели';
export const SESSION_SERIES_START_LABEL = 'Начинать с';
export const SESSION_SERIES_HORIZON_LABEL = 'Продолжать';
export const SESSION_SERIES_HORIZON_UNITS = ['WEEKS', 'MONTHS'] as const;
/**
 * Сокращения, а не слова: рядом стоит число, и «2 месяцев» пришлось бы
 * склонять по правилам русского счёта ради одной подписи.
 */
export const SESSION_SERIES_HORIZON_UNIT_LABELS = {
  WEEKS: 'нед.',
  MONTHS: 'мес.',
} as const;
export const SESSION_SERIES_HORIZON_MAX = 52;
export const SESSION_SERIES_PREVIEW_PREFIX = 'Будет создано встреч';
export const SESSION_SERIES_EMPTY_HINT =
  'В выбранном промежутке нет ни одного подходящего дня.';
export const SESSION_SERIES_CREATE_LABEL = 'Создать серию';
export const SESSION_SERIES_CREATED_TOAST = 'Серия сессий создана';
/** Предел серии: столько же встреч за раз принимает сервис. */
export const SESSION_SERIES_MAX = 100;
export const SESSION_COPY_LABEL = 'Скопировать';
export const SESSION_CREATE_TITLE = 'Новая сессия';
export const SESSION_COPY_TITLE = 'Копия сессии';
export const SESSION_COPY_DESCRIPTION =
  'Стоимость, условия оплаты и принятые игроки перенесутся. Присутствие каждого игрока сбросится на «Не буду».';
export const SESSION_TITLE_LABEL = 'Название';
export const SESSION_TITLE_PLACEHOLDER = 'Знакомство с Баровией';
export const SESSION_COPY_TITLE_PLACEHOLDER =
  'Оставьте пустым, чтобы сохранить прежнее';
export const SESSION_STARTS_AT_LABEL = 'Начало';
export const SESSION_DATE_LABEL = 'Дата';
/**
 * Время встречи мастер задаёт границами, а не длительностью: он думает
 * «с семи до одиннадцати», а не «четыре часа».
 */
export const SESSION_TIME_START_LABEL = 'Начало';
export const SESSION_TIME_END_LABEL = 'Конец';
export const SESSION_TIME_RANGE_HINT =
  'Конец раньше начала — сессия заканчивается на следующий день';

/**
 * Формат времени сессии со смещением часового пояса. Игроки собираются из
 * разных поясов, и «17:00» без пояса каждый читает по-своему; время всегда
 * показывается в поясе смотрящего, а смещение это проговаривает.
 */
export const SESSION_DATE_FORMAT = 'LLL ([UTC]Z)';

export const SESSION_TIMEZONE_HINT_PREFIX = 'Время в вашем часовом поясе';

export const SESSION_START_LABEL = 'Начать';
export const SESSION_STARTED_TOAST = 'Сессия начата';
export const SESSION_COMPLETE_LABEL = 'Завершить';
export const SESSION_CANCEL_LABEL = 'Отменить';
export const SESSION_CANCEL_TITLE = 'Отмена сессии';

export const SESSION_CANCEL_DESCRIPTION =
  'Сессия будет отмечена как несостоявшаяся: она уйдёт из предстоящих, места освободятся, а поданные заявки останутся историей. Вернуть её в набор нельзя.';

export const SESSION_CANCELLED_TOAST = 'Сессия отменена';
export const SESSION_COMPLETE_TITLE = 'Завершение сессии';

export const SESSION_COMPLETE_DESCRIPTION =
  'Сессия уйдёт из предстоящих, места в ней освободятся, а поданные заявки останутся историей. Вернуть сессию в набор нельзя.';

export const SESSION_COMPLETED_TOAST = 'Сессия завершена';

/** Разумный потолок для одной сессии — сутки. */

/** Верхняя граница поля минут: 60 и больше — это уже следующий час. */

/** Шаг поля минут: за столом время планируют четвертями часа. */
export const SESSION_PRICE_LABEL = 'Стоимость';
export const SESSION_CURRENCY_LABEL = 'Валюта';
export const SESSION_CURRENCY_PLACEHOLDER = 'Выберите валюту';

/**
 * Валюты оплаты сессии. Сервис принимает трёхбуквенный код ISO 4217, а
 * вводить его руками — источник опечаток вроде «РУБ» или «rub», поэтому
 * мастер выбирает из списка. Список открытый: не хватает валюты — допишите
 * сюда, ограничение сервиса это не нарушит.
 */
/** Валюта по умолчанию: большинство игр на сайте считают в рублях. */
export const SESSION_DEFAULT_CURRENCY = 'RUB';

export const SESSION_CURRENCIES = [
  { code: 'RUB', name: 'Российский рубль' },
  { code: 'BYN', name: 'Белорусский рубль' },
  { code: 'KZT', name: 'Тенге' },
  { code: 'UAH', name: 'Гривна' },
  { code: 'AMD', name: 'Драм' },
  { code: 'GEL', name: 'Лари' },
  { code: 'KGS', name: 'Сом' },
  { code: 'UZS', name: 'Сум' },
  { code: 'EUR', name: 'Евро' },
  { code: 'USD', name: 'Доллар США' },
  { code: 'RSD', name: 'Сербский динар' },
  { code: 'TRY', name: 'Турецкая лира' },
] as const;
export const SESSION_PAYMENT_TYPE_LABEL = 'Оплата';
export const SESSION_FREE_SESSION_LABEL = 'Эта сессия бесплатная';

export const SESSION_FREE_SESSION_HINT =
  'Знакомство или отработку можно провести без оплаты, даже если игра платная.';

export const SESSION_PAID_HINT =
  'Игра платная: сумма, валюта и условия оплаты обязательны.';
export const SESSION_FREE_HINT =
  'Игра бесплатная: платёжные поля у сессии не заполняются.';
export const SESSION_CREATED_TOAST = 'Сессия создана';
export const SESSION_COPIED_TOAST = 'Сессия скопирована';
/**
 * Состояния сессий, показываемые по умолчанию: то, что впереди, и то, что
 * идёт прямо сейчас. Завершённые и отменённые копятся у долгой кампании и
 * заслоняют набор, ради которого страницу и открывают.
 */
export const SESSIONS_DEFAULT_STATUSES = ['SCHEDULED', 'IN_PROGRESS'] as const;

export const SESSIONS_FILTER_LABEL = 'Состояние сессий';
export const SESSIONS_FILTER_PLACEHOLDER = 'Все состояния';

export const SESSIONS_EMPTY_FILTERED_TITLE = 'Таких сессий нет';

export const SESSIONS_EMPTY_FILTERED_DESCRIPTION =
  'Ни одна сессия игры не в выбранном состоянии.';

/* Расписание: таймлайн и список. */

/**
 * Масштаб таймлайна — длина показанного периода, как в календаре. Разброс
 * велик — от разовой встречи до кампании на год, — и одним периодом такое не
 * охватить.
 *
 * Дня среди масштабов нет: сессии идут раз в неделю или реже, и однодневное
 * окно почти всегда пустует.
 */
export const SESSION_TIMELINE_SCALES = ['WEEK', 'MONTH', 'YEAR'] as const;

export const SESSION_TIMELINE_SCALE_LABELS = {
  WEEK: 'Неделя',
  MONTH: 'Месяц',
  YEAR: 'Год',
} as const;

/**
 * Масштаб по умолчанию. Сессии обычно идут раз в неделю, и в месяце их видно
 * сразу несколько — ближайшая и то, что за ней.
 */
export const SESSION_TIMELINE_DEFAULT_SCALE = 'MONTH';

/** Дата сессии на оси: чем шире период, тем крупнее единица в подписи. */
export const SESSION_TIMELINE_DATE_FORMATS = {
  WEEK: 'dd, HH:mm',
  MONTH: 'D MMM, HH:mm',
  YEAR: 'D MMM, HH:mm',
} as const;

/** Подпись периода: у недели диапазон дат, у года — только год. */
export const SESSION_TIMELINE_WINDOW_FORMATS = {
  WEEK: 'D MMMM YYYY',
  MONTH: 'MMMM YYYY',
  YEAR: 'YYYY',
} as const;

export const SESSION_TIMELINE_VIEW_LABEL = 'Таймлайн';
export const SESSION_LIST_VIEW_LABEL = 'Список';
export const SESSIONS_VIEW_LABEL = 'Вид расписания';
export const SESSION_TIMELINE_SCALE_LABEL = 'Масштаб';
export const SESSION_TIMELINE_PREV_LABEL = 'Предыдущий период';
export const SESSION_TIMELINE_NEXT_LABEL = 'Следующий период';
export const SESSION_TIMELINE_TODAY_LABEL = 'Сегодня';
export const SESSION_TIMELINE_NEAREST_LABEL = 'К ближайшей сессии';
export const SESSION_TIMELINE_NEAREST_BADGE = 'Ближайшая';
export const SESSION_TIMELINE_NOW_BADGE = 'Сейчас';
export const SESSION_TIMELINE_EMPTY_TITLE = 'В этом периоде сессий нет';
export const SESSION_TIMELINE_EMPTY_DESCRIPTION =
  'Смените масштаб, перелистните период или перейдите к ближайшей сессии.';
export const SESSION_DETAIL_TITLE = 'Сессия';
export const SESSION_TIMELINE_OUTSIDE_PREFIX = 'Вне периода';

export const SESSIONS_EMPTY_TITLE = 'Сессий пока нет';
export const SESSIONS_EMPTY_MASTER_DESCRIPTION =
  'Создайте первую сессию, чтобы игроки могли подать заявку.';
export const SESSIONS_EMPTY_PLAYER_DESCRIPTION =
  'Мастер ещё не назначил ни одной сессии.';
export const GAME_APPROVED_PLAYERS_LABEL = 'Принято игроков';
export const SESSION_PARTICIPANTS_COUNT_LABEL = 'Участников';
export const SESSION_REGISTRATIONS_LABEL = 'Заявки';
export const SESSION_PARTICIPANTS_LABEL = 'Участники';

export const SESSION_PARTICIPANTS_EMPTY_TITLE =
  'В сессии пока никого нет — состав появится, когда мастер примет заявки';

export const PAYMENT_SAVED_TOAST = 'Отметка оплаты сохранена';

/* Подписи заявок игрока. */
export const APPLY_LABEL = 'Подать заявку';
export const APPLY_TITLE = 'Заявка на сессию';
export const APPLY_CHARACTER_SHEET_LABEL = 'Ссылка на лист персонажа';
export const APPLY_CHARACTER_SHEET_PLACEHOLDER =
  'https://ttg.club/tools/character-sheet';
/* Чем игрок представляет персонажа в заявке. */
export const APPLY_SOURCES = ['SHEET', 'LINK', 'NAME'] as const;

export const APPLY_SOURCE_LABELS = {
  SHEET: 'Мой лист',
  LINK: 'Ссылка',
  NAME: 'Только имя',
} as const;

export const APPLY_OWN_SHEET_LABEL = 'Лист персонажа';
export const APPLY_OWN_SHEET_PLACEHOLDER = 'Выберите свой лист';

export const APPLY_OWN_SHEET_EMPTY =
  'Своих листов пока нет — приложите ссылку или назовите персонажа';

export const APPLY_OWN_SHEET_HINT =
  'Мастер откроет лист по ссылке; доступ включится автоматически.';

export const APPLY_CHARACTER_NAME_LABEL = 'Имя персонажа';
export const APPLY_CHARACTER_NAME_PLACEHOLDER = 'Тассельхоф Непоседа';

export const APPLY_SHARE_FAILED_MESSAGE =
  'Не удалось открыть доступ к листу по ссылке';
export const APPLY_WITHDRAW_LABEL = 'Отозвать заявку';
export const APPLY_WITHDRAWN_TOAST = 'Заявка отозвана';

export const APPLY_SENT_TOAST = 'Заявка отправлена';
export const ATTENDANCE_TITLE = 'Придёте на сессию?';
export const ATTENDANCE_SAVED_TOAST = 'Присутствие обновлено';
export const PAYMENT_PAID_LABEL = 'Оплачено';
export const PAYMENT_UNPAID_LABEL = 'Не оплачено';
export const PAYMENT_MARK_LABEL = 'Отметить оплату';
export const PAYMENT_UNMARK_LABEL = 'Снять отметку';
export const REGISTRATION_APPROVE_LABEL = 'Принять';
export const REGISTRATION_REJECT_LABEL = 'Отклонить';
export const REGISTRATION_EXCLUDE_LABEL = 'Исключить';
export const REGISTRATION_EXCLUDE_HINT =
  'Игрок покинет игру и все незакрытые сессии';
export const REGISTRATION_REJECT_TITLE = 'Отклонение заявки';
export const REGISTRATION_EXCLUDE_TITLE = 'Исключение игрока';
export const REGISTRATION_REASON_LABEL = 'Причина (необязательно)';
export const REGISTRATION_REASON_PLACEHOLDER =
  'Например: состав уже собран под другой стиль игры';
export const REGISTRATION_REASON_HINT =
  'Игрок увидит её у своей заявки. Оставьте пустой, если объяснять нечего.';
export const REGISTRATION_REASON_MAX_LENGTH = 500;
export const REGISTRATION_REJECTED_REASON_TITLE = 'Причина отказа';
export const REGISTRATION_REVIEWED_TOAST = 'Заявка обработана';
export const REGISTRATION_CHARACTER_SHEET_LABEL = 'Лист персонажа';
export const REGISTRATIONS_EMPTY_TITLE = 'Заявок пока нет';
export const REGISTRATIONS_FULL_HINT =
  'Все места заняты: принять ещё одного игрока не получится.';

/* Пустые состояния и ошибки каталога. */
export const CATALOG_EMPTY_TITLE = 'Игр не нашлось';
export const CATALOG_EMPTY_DESCRIPTION =
  'Попробуйте ослабить условия подбора или сбросить фильтры.';
export const CATALOG_ERROR_TITLE = 'Не удалось загрузить каталог';
export const CATALOG_RETRY_LABEL = 'Повторить';

/** Параметр приглашения в адресе приватной игры. */
export const INVITE_CODE_QUERY_KEY = 'inviteCode';
