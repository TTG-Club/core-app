import type {
  CommentsModerationTab,
  CommentStatus,
  UserCommentsTab,
} from './types';

/** Базовый путь сервиса комментариев (Nitro проксирует на NITRO_COMMENTS_API_URL). */
export const COMMENTS_API_PATH = '/api/v1/comments';

/**
 * Число опубликованных комментариев текущего пользователя (для статистики
 * профиля). Требует свежей сборки сервиса — до деплоя отвечает 404.
 */
export const COMMENTS_MY_COUNT_PATH = `${COMMENTS_API_PATH}/my/count`;

/** Модерационная лента всех комментариев независимо от статуса. */
export const COMMENTS_MODERATION_ALL_PATH = `${COMMENTS_API_PATH}/moderation`;

/** Модерационная лента жалоб (доступна только модераторам сервиса). */
export const COMMENTS_MODERATION_DISLIKED_PATH = `${COMMENTS_API_PATH}/moderation/disliked`;

/** Вкладки модерационного раздела админки. */
export const COMMENTS_MODERATION_TABS: Array<{
  label: string;
  value: CommentsModerationTab;
}> = [
  { label: 'С жалобами', value: 'disliked' },
  { label: 'Все комментарии', value: 'all' },
];

/** Размер страницы модерационного списка жалоб. */
export const COMMENTS_MODERATION_PAGE_SIZE = 20;

/** Вкладки списка комментариев пользователя в админ-детали. */
export const USER_COMMENTS_TABS: Array<{
  label: string;
  value: UserCommentsTab;
}> = [
  { label: 'Опубликованные', value: 'published' },
  { label: 'Удалённые', value: 'deleted' },
  { label: 'Все', value: 'all' },
];

/** Заголовок секции комментариев пользователя в админ-детали. */
export const USER_COMMENTS_SECTION_TITLE = 'Комментарии';

/** Подпись, когда автор не оставлял комментариев вообще. */
export const USER_COMMENTS_EMPTY_MESSAGE =
  'Пользователь не оставлял комментариев';

/** Подписи пустых вкладок, когда загружены все комментарии автора. */
export const USER_COMMENTS_EMPTY_TAB_MESSAGES: Record<UserCommentsTab, string> =
  {
    published: 'Опубликованных комментариев нет',
    deleted: 'Удалённых комментариев нет',
    all: 'Комментариев нет',
  };

/**
 * Подписи пустых вкладок, когда загружена только часть ленты: утверждать
 * отсутствие нельзя — нужные комментарии могут лежать на следующих страницах.
 */
export const USER_COMMENTS_PARTIAL_EMPTY_TAB_MESSAGES: Record<
  UserCommentsTab,
  string
> = {
  published: 'Среди загруженных опубликованных нет — загрузите ещё',
  deleted: 'Среди загруженных удалённых нет — загрузите ещё',
  all: 'Среди загруженных ничего нет — загрузите ещё',
};

/** Подпись кнопки повторной попытки после ошибки загрузки. */
export const USER_COMMENTS_RETRY_LABEL = 'Попробовать снова';

/** Подпись кнопки догрузки следующей страницы. */
export const USER_COMMENTS_LOAD_MORE_LABEL = 'Показать ещё';

/** Подпись состояния загрузки списка. */
export const USER_COMMENTS_LOADING_LABEL = 'Загрузка…';

/** Подпись «это ответ», когда сервис прислал имя автора родителя. */
export const ADMIN_COMMENT_REPLY_TO_PREFIX = 'в ответ';

/** Подпись «это ответ», когда имя автора родителя неизвестно. */
export const ADMIN_COMMENT_REPLY_TO_FALLBACK = 'ответ на комментарий';

/** Подпись кнопки перехода к комментарию на его странице. */
export const ADMIN_COMMENT_OPEN_LABEL = 'Открыть';

/** Подпись кнопки удаления (тултип и aria-label — один текст). */
export const ADMIN_COMMENT_DELETE_LABEL = 'Удалить комментарий';

/** Заголовок диалога подтверждения удаления. */
export const ADMIN_COMMENT_DELETE_DIALOG_TITLE = 'Удалить комментарий?';

/** Подпись кнопки подтверждения в диалоге удаления. */
export const ADMIN_COMMENT_DELETE_CONFIRM_LABEL = 'Удалить';

/** Предупреждение диалога, когда у комментария есть ответы. */
export const ADMIN_COMMENT_DELETE_BRANCH_WARNING =
  'Ответы этой ветки тоже перестанут отображаться.';

/** Предупреждение диалога для комментария без ответов. */
export const ADMIN_COMMENT_DELETE_IRREVERSIBLE_WARNING =
  'Действие нельзя отменить.';

/** Тост успешного удаления. */
export const ADMIN_COMMENT_DELETED_TOAST = 'Комментарий удалён';

/** Тост неудачного удаления. */
export const ADMIN_COMMENT_DELETE_ERROR_TOAST =
  'Не удалось удалить комментарий';

/** Тултип кнопки восстановления. */
export const ADMIN_COMMENT_RESTORE_TOOLTIP =
  'Вернуть комментарий в опубликованные';

/** Доступное имя кнопки восстановления (у кнопки только иконка). */
export const ADMIN_COMMENT_RESTORE_LABEL = 'Восстановить комментарий';

/** Тост успешного восстановления. */
export const ADMIN_COMMENT_RESTORED_TOAST = 'Комментарий восстановлен';

/** Тост неудачного восстановления. */
export const ADMIN_COMMENT_RESTORE_ERROR_TOAST =
  'Не удалось восстановить комментарий';

/** Тост и заголовок ошибки загрузки списка комментариев. */
export const COMMENTS_LOAD_ERROR_TOAST = 'Не удалось загрузить комментарии';

/**
 * Размер страницы списка комментариев пользователя. Крупнее модерационного:
 * лента приходит без фильтра по статусу, а вкладки делят её уже на клиенте —
 * чем больше загружено за раз, тем реже счётчики вкладок неполные.
 */
export const COMMENTS_USER_PAGE_SIZE = 50;

/** Подписи статусов комментария. */
export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  PUBLISHED: 'Опубликован',
  DELETED: 'Удалён',
  PENDING_MODERATION: 'На модерации',
  REJECTED: 'Отклонён',
  SPAM: 'Спам',
  HIDDEN_BY_BAN: 'Скрыт (бан автора)',
};

/**
 * Цвета бейджей статусов комментария. `HIDDEN_BY_BAN` — предупреждение, а не
 * ошибка: это следствие блокировки автора, а не решение модератора по тексту.
 */
export const COMMENT_STATUS_COLORS: Record<
  CommentStatus,
  'success' | 'neutral' | 'warning' | 'error'
> = {
  PUBLISHED: 'success',
  DELETED: 'neutral',
  PENDING_MODERATION: 'warning',
  REJECTED: 'error',
  SPAM: 'error',
  HIDDEN_BY_BAN: 'warning',
};

/** Словоформы для счётчика жалоб. */
export const COMMENT_DISLIKES_PLURAL_FORMS: [string, string, string] = [
  'жалоба',
  'жалобы',
  'жалоб',
];

/**
 * Разделы сайта, где включены комментарии. Значение — первый сегмент
 * канонического пути деталки (`/articles/slug` → `articles`), он же
 * передаётся сервису параметром `section`.
 */
export const COMMENTS_ENABLED_SECTIONS: ReadonlyArray<string> = [
  'articles',
  'backgrounds',
  'bestiary',
  'classes',
  'feats',
  'glossary',
  'items',
  'magic-items',
  'species',
  'sources',
  'spells',
];

/** Размер страницы корневых комментариев. */
export const COMMENTS_PAGE_SIZE = 10;

/** Размер выборки для свёрнутого превью — только самый свежий корень. */
export const COMMENTS_PREVIEW_PAGE_SIZE = 1;

/** Сортировка корней: свежие обсуждения сверху. */
export const COMMENTS_ROOT_SORT = 'createdAt,desc';

/**
 * Локальная пауза между отправками после успешного комментария (секунды) —
 * зеркало антиспам-лимита сервиса, чтобы пользователь не упирался в 429.
 * Отказ 429 ставит паузу уже по `retryAfterSeconds` из ответа.
 */
export const COMMENT_SUBMIT_COOLDOWN_SECONDS = 20;

/** Максимальная длина текста комментария (сервер ввод не валидирует — только фронт). */
export const COMMENT_CONTENT_MAX_LENGTH = 3000;

/** Ограничение сервиса на длину раздела (`section`). */
export const COMMENT_SECTION_MAX_LENGTH = 100;

/** Ограничение сервиса на длину URL страницы. */
export const COMMENT_URL_MAX_LENGTH = 255;

/**
 * Максимальная визуальная глубина ветки: глубже ответы рисуются «ровно»,
 * без нового отступа, но с подписью, кому отвечают.
 */
export const COMMENTS_MAX_VISUAL_DEPTH = 3;

/**
 * Предохранитель рекурсивной догрузки ответов: сервис не ограничивает глубину
 * ветки, фронт за один раз не уходит глубже этого числа уровней — хвост
 * догружается кнопкой «Показать ответы» уже внутри ветки.
 */
export const COMMENTS_REPLIES_DEPTH_LIMIT = 20;

/** Префикс DOM-якоря комментария (`#comment-<id>`). */
export const COMMENT_ANCHOR_PREFIX = 'comment-';

/** Сколько держится подсветка комментария, открытого по якорю (мс). */
export const COMMENT_HIGHLIGHT_DURATION_MS = 2000;

/** Формат даты и времени комментария. */
export const COMMENT_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

/** Словоформы для счётчика ответов. */
export const COMMENT_REPLIES_PLURAL_FORMS: [string, string, string] = [
  'ответ',
  'ответа',
  'ответов',
];

/** Словоформы для счётчика комментариев. */
export const COMMENTS_PLURAL_FORMS: [string, string, string] = [
  'комментарий',
  'комментария',
  'комментариев',
];

/** Сообщение об ошибке, когда сервис не прислал текст. */
export const COMMENTS_UNKNOWN_ERROR_MESSAGE =
  'Не удалось выполнить действие. Попробуйте позже';
