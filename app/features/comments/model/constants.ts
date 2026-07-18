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

/** Заголовок блока комментариев — и в ленте сайта, и в админ-детали. */
export const COMMENTS_SECTION_TITLE = 'Комментарии';

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
export const COMMENTS_RETRY_LABEL = 'Попробовать снова';

/** Подпись кнопки догрузки следующей страницы. */
export const COMMENTS_LOAD_MORE_LABEL = 'Показать ещё';

/** Подпись состояния загрузки списка. */
export const USER_COMMENTS_LOADING_LABEL = 'Загрузка…';

/** Подпись «это ответ», когда сервис прислал имя автора родителя. */
export const COMMENT_REPLY_TO_PREFIX = 'в ответ';

/** Подпись «это ответ», когда имя автора родителя неизвестно. */
export const ADMIN_COMMENT_REPLY_TO_FALLBACK = 'ответ на комментарий';

/** Подпись кнопки перехода к комментарию на его странице. */
export const ADMIN_COMMENT_OPEN_LABEL = 'Открыть';

/** Заголовок страницы модерации комментариев. */
export const ADMIN_COMMENTS_PAGE_TITLE = 'Комментарии: Модерация';

/** Описание вкладки «Все комментарии». */
export const ADMIN_COMMENTS_ALL_DESCRIPTION =
  'Все комментарии сайта — от новых к старым, включая удалённые и отклонённые.';

/** Описание вкладки «С жалобами». */
export const ADMIN_COMMENTS_DISLIKED_DESCRIPTION =
  'Комментарии, на которые пользователи отправили жалобы, — от самых обжалуемых к менее. Ссылка «Открыть» ведёт к комментарию на его странице.';

/** Подпись пустой вкладки «Все комментарии». */
export const ADMIN_COMMENTS_ALL_EMPTY_MESSAGE = 'Комментариев пока нет.';

/** Подпись пустой вкладки «С жалобами». */
export const ADMIN_COMMENTS_DISLIKED_EMPTY_MESSAGE =
  'Жалоб нет — очередь модерации пуста.';

/** Начало подписи «загружено столько-то из стольких-то». */
export const COMMENTS_LOADED_COUNT_PREFIX = 'Загружено';

/** Предлог в подписи «загружено столько-то из стольких-то». */
export const COMMENTS_LOADED_COUNT_SEPARATOR = 'из';

/** Подпись кнопки удаления (тултип и aria-label — один текст). */
export const ADMIN_COMMENT_DELETE_LABEL = 'Удалить комментарий';

/** Тост успешного удаления. */
export const ADMIN_COMMENT_DELETED_TOAST = 'Комментарий удалён';

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

/**
 * Размер выборки для свёрнутого превью (откат, когда недоступен `/latest`).
 * Не один корень: сверху ленты могут стоять надгробия удалённых, из которых
 * превью не собрать, — из небольшой выборки берётся первый живой.
 */
export const COMMENTS_PREVIEW_PAGE_SIZE = 3;

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

// Подписи карточки комментария в ленте сайта.

/**
 * Текст заглушки на месте удалённого комментария, который держит видимой
 * ветку своих ответов («надгробие»). Совпадает с `ADMIN_COMMENT_DELETED_TOAST`
 * случайно: там это сообщение о действии, здесь — подпись элемента.
 */
export const COMMENT_TOMBSTONE_TEXT = 'Комментарий удалён';

/** Бейдж на своём комментарии. */
export const COMMENT_OWN_BADGE_LABEL = 'Вы';

/** Пометка отредактированного комментария. */
export const COMMENT_EDITED_MARK = '(изменено)';

/** Доступное имя меню действий (у кнопки только иконка). */
export const COMMENT_ACTIONS_MENU_LABEL = 'Действия с комментарием';

/** Подпись действия «скопировать якорную ссылку». */
export const COMMENT_COPY_LINK_LABEL = 'Скопировать ссылку';

/** Подпись действия «перейти к родительскому комментарию». */
export const COMMENT_SHOW_PARENT_LABEL = 'Показать родительский';

/** Подпись действия «редактировать». */
export const COMMENT_EDIT_LABEL = 'Редактировать';

/** Подпись действия «удалить» в меню карточки. */
export const COMMENT_DELETE_MENU_LABEL = 'Удалить';

/** Подпись действия «пожаловаться». */
export const COMMENT_REPORT_LABEL = 'Пожаловаться';

/** Подпись действия, когда жалоба уже отправлена (кнопка погашена). */
export const COMMENT_REPORTED_LABEL = 'Жалоба отправлена';

/** Подпись кнопки ответа и кнопки отправки формы ответа. */
export const COMMENT_REPLY_LABEL = 'Ответить';

/** Начало подсказки в форме ответа — дальше идёт имя автора. */
export const COMMENT_REPLY_PLACEHOLDER_PREFIX = 'Ответ для';

/** Подсказка в форме правки. */
export const COMMENT_EDIT_PLACEHOLDER = 'Текст комментария';

/** Подпись кнопки отправки формы правки. */
export const COMMENT_EDIT_SUBMIT_LABEL = 'Сохранить';

/** Подпись кнопки, сворачивающей загруженную ветку. */
export const COMMENT_REPLIES_HIDE_LABEL = 'Скрыть ответы';

/** Подпись кнопки ветки, пока число ответов неизвестно. */
export const COMMENT_REPLIES_SHOW_LABEL = 'Показать ответы';

/** Доступное имя линии ветки — клик по ней сворачивает ответы. */
export const COMMENT_THREAD_COLLAPSE_LABEL = 'Свернуть ответы';

// Подписи блока комментариев и формы отправки.

/** Подсказка формы по умолчанию (корневой комментарий). */
export const COMMENT_COMPOSER_PLACEHOLDER = 'Написать комментарий…';

/** Подпись кнопки отправки формы по умолчанию. */
export const COMMENT_COMPOSER_SUBMIT_LABEL = 'Отправить';

/** Подпись кнопки отмены в формах ответа и правки. */
export const COMMENT_COMPOSER_CANCEL_LABEL = 'Отмена';

/**
 * Сокращение «секунд» в отсчёте на кнопке отправки во время антиспам-паузы
 * («Отправить · 12 с»).
 */
export const COMMENT_COOLDOWN_SECONDS_UNIT = 'с';

/** Подсказка формы нового обсуждения под лентой. */
export const COMMENT_COMPOSER_ROOT_PLACEHOLDER = 'Поделитесь мнением…';

/** Подпись, когда у страницы нет ни одного комментария. */
export const COMMENTS_EMPTY_MESSAGE =
  'Пока нет комментариев — начните обсуждение первым.';

/** Начало подписи кнопки разворачивания — дальше идёт число комментариев. */
export const COMMENTS_EXPAND_PREFIX = 'Показать';

/** Подпись кнопки разворачивания, когда комментариев ещё нет. */
export const COMMENTS_EXPAND_EMPTY_LABEL = 'Написать комментарий';

// Тосты ленты комментариев.

/** Ошибка догрузки ветки ответов. */
export const COMMENT_REPLIES_LOAD_ERROR_TOAST = 'Не удалось загрузить ответы';

/** Ошибка отправки корневого комментария. */
export const COMMENT_SUBMIT_ERROR_TOAST = 'Не удалось отправить комментарий';

/** Ошибка отправки ответа. */
export const COMMENT_REPLY_ERROR_TOAST = 'Не удалось отправить ответ';

/** Заголовок ошибки правки, когда комментарий успели удалить (409). */
export const COMMENT_ALREADY_DELETED_TOAST = 'Комментарий уже удалён';

/** Ошибка сохранения правки. */
export const COMMENT_EDIT_ERROR_TOAST = 'Не удалось сохранить изменения';

/** Тост принятой жалобы. */
export const COMMENT_REPORT_SUCCESS_TOAST = 'Жалоба отправлена';

/** Пояснение к тосту принятой жалобы. */
export const COMMENT_REPORT_SUCCESS_DESCRIPTION =
  'Спасибо! Модераторы посмотрят на этот комментарий.';

/** Тост повторной жалобы (409 — уже жаловались). */
export const COMMENT_REPORT_DUPLICATE_TOAST = 'Жалоба уже учтена';

/** Пояснение к тосту повторной жалобы. */
export const COMMENT_REPORT_DUPLICATE_DESCRIPTION =
  'На этот комментарий вы уже жаловались.';

/** Ошибка отправки жалобы. */
export const COMMENT_REPORT_ERROR_TOAST = 'Не удалось отправить жалобу';

// Удаление и восстановление доступны и в ленте сайта (модератору с карточки),
// и в админке — подписи общие, поэтому без префикса ADMIN_.

/** Тост неудачного удаления. */
export const COMMENT_DELETE_ERROR_TOAST = 'Не удалось удалить комментарий';

/** Заголовок диалога подтверждения удаления. */
export const COMMENT_DELETE_DIALOG_TITLE = 'Удалить комментарий?';

/** Подпись кнопки подтверждения в диалоге удаления. */
export const COMMENT_DELETE_CONFIRM_LABEL = 'Удалить';

/**
 * Предупреждение диалога удаления, когда у комментария есть ответы: сама
 * ветка остаётся видимой, вместо комментария в ней встаёт надгробие.
 */
export const COMMENT_DELETE_BRANCH_WARNING =
  'Текст будет скрыт, а ответы этой ветки останутся видны.';

/**
 * Предупреждение диалога удаления для комментария без ответов. Не «нельзя
 * отменить»: удаление мягкое, и модератор может восстановить комментарий.
 */
export const COMMENT_DELETE_IRREVERSIBLE_WARNING =
  'Комментарий исчезнет из обсуждения; вернуть его сможет только модератор.';

/** Тултип кнопки восстановления. */
export const ADMIN_COMMENT_RESTORE_TOOLTIP =
  'Вернуть комментарий в опубликованные';

/** Доступное имя кнопки восстановления (у кнопки только иконка). */
export const COMMENT_RESTORE_LABEL = 'Восстановить комментарий';

/** Тост успешного восстановления. */
export const COMMENT_RESTORED_TOAST = 'Комментарий восстановлен';

/** Тост неудачного восстановления. */
export const COMMENT_RESTORE_ERROR_TOAST =
  'Не удалось восстановить комментарий';

/**
 * Тултип кнопки восстановления на надгробии в ленте сайта. Отдельный от
 * админского: здесь важно объяснить, что текст удалённого сервис в публичных
 * выдачах не отдаёт вовсе и увидеть его можно только так.
 */
export const COMMENT_RESTORE_FEED_TOOLTIP =
  'Восстановить — текст удалённого комментария виден только после этого';

/**
 * Подпись свёрнутого блока, когда обсуждение есть, а превью не собрать:
 * сверху ленты могут стоять надгробия, из которых карточку не сделать.
 */
export const COMMENTS_PREVIEW_UNAVAILABLE =
  'Откройте обсуждение, чтобы прочитать комментарии.';

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
