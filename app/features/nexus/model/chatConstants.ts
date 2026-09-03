/* ------------------------------------------------------------------ */
/* Чат комнаты                                                         */
/* ------------------------------------------------------------------ */

export const CHAT_EVENT_TYPES = [
  'TEXT',
  'DICE_ROLL',
  'SPELL_CAST',
  'SYSTEM',
] as const;

export const CHAT_TEXT_MAX_LENGTH = 4000;

export const CHAT_DICE_EXPRESSION_MAX_LENGTH = 40;

export const CHAT_DICE_LABEL_MAX_LENGTH = 200;

export const CHAT_SPELL_ID_MAX_LENGTH = 100;

export const CHAT_SPELL_NAME_MAX_LENGTH = 200;

export const CHAT_SPELL_TARGET_MAX_LENGTH = 300;

export const CHAT_SPELL_LEVEL_MIN = 0;

export const CHAT_SPELL_LEVEL_MAX = 9;

/**
 * Формат выражения броска ровно такой же, как у сервиса: `NdM`, `NdM+K`,
 * `NdM-K`. Проверяем на клиенте, чтобы не гонять заведомо неверный запрос,
 * но результат броска всегда считает сервер.
 */
export const CHAT_DICE_EXPRESSION_PATTERN =
  /^(\d{1,3})d(\d{1,4})([+-]\d{1,4})?$/i;

export const CHAT_DICE_COUNT_MIN = 1;

export const CHAT_DICE_COUNT_MAX = 100;

export const CHAT_DIE_SIDES_MIN = 2;

export const CHAT_DIE_SIDES_MAX = 1000;

/** Кубы для быстрых кнопок в форме броска. */
export const CHAT_QUICK_DICE = [4, 6, 8, 10, 12, 20, 100] as const;

export const CHAT_HISTORY_PAGE_SIZE = 50;

/** Задержка первой попытки переподключения SSE, мс. */
export const CHAT_RECONNECT_BASE_DELAY = 1000;

/** Потолок задержки переподключения, мс: дальше расти нет смысла. */
export const CHAT_RECONNECT_MAX_DELAY = 30_000;

/** Сколько попыток переподключения делаем, прежде чем сдаться и ждать команды. */
export const CHAT_RECONNECT_MAX_ATTEMPTS = 8;

/**
 * Насколько близко к концу ленты должен быть пользователь, чтобы новое событие
 * прокрутило список само. Дальше — не трогаем прокрутку и показываем счётчик
 * непрочитанных.
 */
export const CHAT_AUTOSCROLL_THRESHOLD_PX = 120;

/** Разрыв между сообщениями одного автора, после которого группа начинается заново, мс. */
export const CHAT_AUTHOR_GROUP_GAP = 5 * 60 * 1000;

export const CHAT_CONNECTION_LABELS = {
  connecting: 'Подключение…',
  connected: 'На связи',
  reconnecting: 'Переподключение…',
  disconnected: 'Нет связи',
} as const;

export const CHAT_CONNECTION_COLORS = {
  connecting: 'warning',
  connected: 'success',
  reconnecting: 'warning',
  disconnected: 'error',
} as const;

export const CHAT_EMPTY_TITLE = 'Пока ни одного сообщения';

export const CHAT_EMPTY_DESCRIPTION = 'Напишите первым.';

export const CHAT_LOAD_OLDER_LABEL = 'Показать предыдущие';

export const CHAT_RECONNECT_LABEL = 'Подключиться';

/** Счётчик пропущенного, пока читали историю. */
export const CHAT_UNREAD_PREFIX = 'Новых сообщений';

export const CHAT_DICE_TOTAL_LABEL = 'Итого';

export const CHAT_FAILED_LABEL = 'Не отправлено';

export const CHAT_RETRY_LABEL = 'Отправить ещё раз';

export const CHAT_SENDING_LABEL = 'Отправляется…';

export const CHAT_SPELL_CANTRIP_LABEL = 'Заговор';

export const CHAT_SPELL_OPEN_LABEL = 'Открыть заклинание';

export const CHAT_SPELL_TARGET_LABEL = 'Цель';

/* Подписи формы отправки. */
export const CHAT_TEXT_PLACEHOLDER = 'Enter — отправить, Shift+Enter — перенос';
export const CHAT_SEND_LABEL = 'Отправить';
export const CHAT_DICE_QUICK_HINT = 'Добавить';

/** Сколько своих сообщений помнит поле ввода. */
export const CHAT_HISTORY_LIMIT = 30;

/** Заголовок ленты комнаты. */
export const NEXUS_CHAT_TITLE = 'Чат';
