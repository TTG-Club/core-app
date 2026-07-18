/**
 * Статус комментария на стороне сервиса. `HIDDEN_BY_BAN` приходит только в
 * модерационных лентах: сервис ставит его всем комментариям заблокированного
 * автора и снимает при разблокировке (межсервисный вызов из auth-service).
 */
export type CommentStatus =
  | 'PUBLISHED'
  | 'DELETED'
  | 'PENDING_MODERATION'
  | 'REJECTED'
  | 'SPAM'
  | 'HIDDEN_BY_BAN';

/** Поля, которые есть у любого комментария — в том числе у надгробия. */
export interface CommentBase {
  id: string;
  /** Раздел страницы обсуждения (старые сборки сервиса не присылают). */
  section: string | null;
  /** URL страницы обсуждения (старые сборки сервиса не присылают). */
  url: string | null;
  parentId: string | null;
  status: CommentStatus;
  /** Число прямых ответов (детей первого уровня). */
  replyCount: number;
  /**
   * Число всех потомков ветки (ответы, ответы на ответы и глубже).
   * Опционально: старые сборки сервиса поле не присылают — тогда точное
   * число собирается на фронте догрузкой веток.
   */
  totalReplyCount: number | null;
  /**
   * Имя автора родительского комментария («кому ответили»). Опционально:
   * приходит там, где родитель не загружен на фронте (превью `/latest`).
   */
  parentAuthorName: string | null;
  createdAt: string;
}

/**
 * Комментарий с содержимым. Так приходят все модерационные ленты (включая
 * удалённые — там текст сохраняется), ответы на создание, правку, жалобу и
 * восстановление, а в публичных выдачах — всё, кроме надгробий.
 */
export interface CommentEntry extends CommentBase {
  authorId: string;
  authorName: string;
  content: string;
  dislikeCount: number;
  editedAt: string | null;
}

/**
 * Надгробие: заглушка на месте удалённого комментария, которая держит ветку
 * его ответов видимой. Приходит только в публичных выдачах и только у
 * удалённого комментария с живыми ответами — без ответов он из выдачи
 * пропадает совсем. Автора и текста у неё нет, место в дереве и счётчики
 * ответов есть.
 */
export interface CommentTombstone extends CommentBase {
  status: 'DELETED';
  authorId: null;
  authorName: null;
  content: null;
  dislikeCount: null;
  editedAt: null;
}

/**
 * Элемент публичной выдачи: обычный комментарий либо надгробие. Различать их
 * следует через `isCommentTombstone` — предикат сужает тип.
 */
export type PublicComment = CommentEntry | CommentTombstone;

/**
 * Страница комментариев (Spring-пагинация). Публичные ручки отдают
 * `CommentsPage<PublicComment>`, модерационные — `CommentsPage<CommentEntry>`.
 */
export interface CommentsPage<TComment = CommentEntry> {
  items: Array<TComment>;
  totalElements: number;
  last: boolean;
}

/** Вкладка модерационного раздела админки. */
export type CommentsModerationTab = 'disliked' | 'all';

/** Вкладка списка комментариев пользователя в админ-детали. */
export type UserCommentsTab = 'published' | 'deleted' | 'all';

/** Параметры антиспам-лимита из отказа 429 на отправку комментария. */
export interface CommentRateLimitInfo {
  /** Секунд до следующей разрешённой попытки; null — сервис не сообщил. */
  retryAfterSeconds: number | null;
  /** Трёхчасовая блокировка после повторных нарушений. */
  blocked: boolean;
}

/**
 * Цель обсуждения, выведенная из канонического пути деталки:
 * пара `section`/`url` — ключ треда в сервисе комментариев.
 */
export interface CommentsTarget {
  /** Раздел сайта (первый сегмент пути, например `spells`). */
  section: string;
  /** Канонический путь страницы (например, `/spells/fireball`). */
  url: string;
}

/** Тело создания корневого комментария или ответа. */
export interface CreateCommentRequest {
  section: string;
  url: string;
  content: string;
}

/**
 * Узел локального дерева комментариев. Сервис отдаёт только прямых детей
 * (`/replies`), поэтому дерево собирается на фронте по мере загрузки веток.
 */
export interface CommentNode {
  comment: PublicComment;
  replies: Array<CommentNode>;
  /** Прямые ответы уже загружены (для листьев — сразу true). */
  repliesLoaded: boolean;
  /** Идёт загрузка поддерева ответов. */
  repliesLoading: boolean;
  /** Ответы развёрнуты (свёртка доступна на корневых ветках). */
  repliesExpanded: boolean;
}

/**
 * Действия над узлами дерева, прокидываемые вниз по рекурсивным веткам
 * (глубина дерева не ограничена, события наверх не всплывают).
 */
export interface CommentTreeActions {
  toggleReplies: (node: CommentNode) => Promise<void>;
  submitReply: (node: CommentNode, content: string) => Promise<boolean>;
  submitEdit: (node: CommentNode, content: string) => Promise<boolean>;
  removeComment: (node: CommentNode) => Promise<boolean>;
  /**
   * Возвращает надгробие в опубликованные (модератор, админ). Для остальных
   * ролей сервис отвечает 403, поэтому кнопка им не показывается.
   */
  restoreTombstone: (node: CommentNode) => Promise<boolean>;
  submitReport: (node: CommentNode) => Promise<void>;
  isOwnComment: (node: CommentNode) => boolean;
  isCommentReported: (commentId: string) => boolean;
  /** Скроллит к отрисованному комментарию и коротко подсвечивает его. */
  highlightComment: (commentId: string) => void;
  /**
   * Абсолютная якорная ссылка на комментарий — всегда на каноническую
   * страницу обсуждения, а не на текущий адрес (в дровере и широкой панели
   * адрес страницы не совпадает с адресом деталки).
   */
  getCommentLink: (commentId: string) => string;
}
