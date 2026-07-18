/** Статус комментария на стороне сервиса. */
export type CommentStatus =
  | 'PUBLISHED'
  | 'DELETED'
  | 'PENDING_MODERATION'
  | 'REJECTED'
  | 'SPAM';

/** Комментарий из ответа сервиса комментариев. */
export interface CommentEntry {
  id: string;
  /** Раздел страницы обсуждения (старые сборки сервиса не присылают). */
  section: string | null;
  /** URL страницы обсуждения (старые сборки сервиса не присылают). */
  url: string | null;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
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
  dislikeCount: number;
  createdAt: string;
  editedAt: string | null;
}

/** Страница корневых комментариев (Spring-пагинация). */
export interface CommentsPage {
  items: Array<CommentEntry>;
  totalElements: number;
  last: boolean;
}

/** Вкладка модерационного раздела админки. */
export type CommentsModerationTab = 'disliked' | 'all';

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
  comment: CommentEntry;
  /** Имя автора родителя — подпись «кому ответили» в плоской части ветки. */
  replyToName: string | null;
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
