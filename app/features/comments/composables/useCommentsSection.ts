import type { CommentEntry, CommentNode } from '../model';

import {
  COMMENT_SUBMIT_COOLDOWN_SECONDS,
  COMMENTS_PREVIEW_PAGE_SIZE,
  COMMENTS_REPLIES_DEPTH_LIMIT,
  createCommentNode,
  createCommentReply,
  createRootComment,
  deleteComment,
  fetchCommentById,
  fetchCommentReplies,
  fetchCommentsCount,
  fetchLatestComment,
  fetchRootComments,
  findCommentNode,
  getCommentErrorMessage,
  getCommentFetchStatus,
  getCommentRateLimit,
  hasServerReplyTotal,
  isCommentFromThread,
  removeCommentNode,
  reportComment,
  updateComment,
} from '../model';
import { useCommentSubmitCooldown } from './useCommentSubmitCooldown';

/**
 * Поднимается по цепочке `parentId` до корневого комментария ветки.
 * @param commentId Идентификатор комментария (может быть и корнем).
 * @param threadSection Раздел треда, в который поднимаем ветку.
 * @param threadUrl URL страницы треда.
 * @returns Корневой комментарий либо null при разрыве или цикле в цепочке,
 * а также если комментарий принадлежит другому треду (на экране может быть
 * несколько блоков сразу — страница и дровер, якорь адресован одному из них).
 */
async function fetchRootOfComment(
  commentId: string,
  threadSection: string,
  threadUrl: string,
): Promise<CommentEntry | null> {
  const visitedIds = new Set<string>([commentId]);

  let currentEntry = await fetchCommentById(commentId);

  if (!isCommentFromThread(currentEntry, threadSection, threadUrl)) {
    return null;
  }

  while (currentEntry.parentId) {
    // Битые данные могут закольцевать цепочку — прерываемся, а не виснем.
    if (visitedIds.has(currentEntry.parentId)) {
      return null;
    }

    visitedIds.add(currentEntry.parentId);
    currentEntry = await fetchCommentById(currentEntry.parentId);
  }

  return currentEntry;
}

interface UseCommentsSectionOptions {
  /** Раздел сайта в сервисе комментариев. */
  section: string;
  /** URL страницы внутри раздела (ключ обсуждения). */
  url: string;
}

/**
 * Состояние блока комментариев страницы: лента корней с серверной
 * пагинацией, локальное дерево ответов, создание/правка/удаление и жалобы.
 *
 * Сервис отдаёт только прямых детей комментария, поэтому ветка догружается
 * рекурсивно отдельными запросами. Удаление мягкое: сервис прячет всю ветку,
 * локально узел убирается вместе с поддеревом.
 */
export function useCommentsSection(options: UseCommentsSectionOptions) {
  const toast = useToast();
  const { user } = useUser();

  const rootNodes = ref<Array<CommentNode>>([]);

  /** Комментарии страницы вместе с ответами (эндпоинт `/count`). */
  const totalCount = ref(0);

  const currentPage = ref(0);
  const isLastPage = ref(true);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const loadError = ref<unknown>(null);

  /** Самый свежий корневой комментарий — для свёрнутого превью. */
  const latestComment = ref<CommentEntry | null>(null);

  const isPreviewLoading = ref(false);

  /**
   * Жалобы, отправленные в этой сессии. Сервис не отдаёт флаг «я уже
   * жаловался» — узнать можно только по 409, и после перезагрузки страницы
   * состояние кнопки не восстановить.
   */
  const reportedCommentIds = ref<Set<string>>(new Set());

  /**
   * Показывает тост с текстом ошибки сервиса.
   */
  function notifyError(error: unknown, title: string): void {
    toast.add({
      title,
      description: getCommentErrorMessage(error),
      color: 'error',
      icon: 'tabler:alert-triangle',
    });
  }

  const { startCooldown } = useCommentSubmitCooldown();

  /**
   * Отказ отправки: при 429 включает паузу на срок из ответа сервиса —
   * его отсчёт идёт от последнего успешного комментария, поэтому локальные
   * 20 секунд здесь ставить нельзя (кнопка разблокировалась бы раньше,
   * чем разрешит сервис). Затем показывает тост с текстом сервиса.
   */
  function notifySubmitError(error: unknown, title: string): void {
    if (getCommentFetchStatus(error) === 429) {
      const { retryAfterSeconds } = getCommentRateLimit(error);

      if (retryAfterSeconds != null) {
        startCooldown(retryAfterSeconds);
      }
    }

    notifyError(error, title);
  }

  /**
   * Самый свежий комментарий страницы для превью. Предпочтителен `/latest`
   * (учитывает ответы внутри веток), при его отсутствии — откат к последнему
   * корневому комментарию (свежий ответ в глубине ветки в него не попадёт).
   */
  async function fetchPreviewComment(): Promise<CommentEntry | null> {
    try {
      return await fetchLatestComment(options.section, options.url);
    } catch (error) {
      // 401 — не «эндпоинта нет», а протухла сессия: пробрасываем наверх.
      if (getCommentFetchStatus(error) === 401) {
        throw error;
      }

      const previewPage = await fetchRootComments(
        options.section,
        options.url,
        0,
        COMMENTS_PREVIEW_PAGE_SIZE,
      );

      return previewPage.items[0] ?? null;
    }
  }

  /**
   * Лёгкая загрузка свёрнутого превью: самый свежий комментарий и общий
   * счётчик страницы.
   */
  async function loadPreview(): Promise<void> {
    isPreviewLoading.value = true;
    loadError.value = null;

    try {
      const [preview, commentsCount] = await Promise.all([
        fetchPreviewComment(),
        fetchCommentsCount(options.section, options.url),
      ]);

      latestComment.value = preview;
      totalCount.value = commentsCount;
    } catch (error) {
      loadError.value = error;
    } finally {
      isPreviewLoading.value = false;
    }
  }

  /**
   * Первичная загрузка: первая страница корней и общий счётчик параллельно.
   */
  async function loadComments(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;

    try {
      const [firstPage, commentsCount] = await Promise.all([
        fetchRootComments(options.section, options.url, 0),
        fetchCommentsCount(options.section, options.url),
      ]);

      rootNodes.value = firstPage.items.map((comment) =>
        createCommentNode(comment, null),
      );

      currentPage.value = 0;
      isLastPage.value = firstPage.last;
      totalCount.value = commentsCount;

      void prefetchReplyCounts();
    } catch (error) {
      loadError.value = error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Догрузка следующей страницы корней. Свежие комментарии могли сдвинуть
   * серверную пагинацию — уже показанные отфильтровываются по id.
   */
  async function loadMoreComments(): Promise<void> {
    if (isLastPage.value || isLoadingMore.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      const nextPage = await fetchRootComments(
        options.section,
        options.url,
        currentPage.value + 1,
      );

      const knownIds = new Set(rootNodes.value.map((node) => node.comment.id));

      const freshNodes = nextPage.items
        .filter((comment) => !knownIds.has(comment.id))
        .map((comment) => createCommentNode(comment, null));

      rootNodes.value = [...rootNodes.value, ...freshNodes];
      currentPage.value += 1;
      isLastPage.value = nextPage.last;

      void prefetchReplyCounts();
    } catch (error) {
      notifyError(error, 'Не удалось загрузить комментарии');
    } finally {
      isLoadingMore.value = false;
    }
  }

  /**
   * Тихо обновляет серверный счётчик комментариев страницы.
   * Сбой не показываем: счётчик — вторичная информация.
   */
  async function refreshCount(): Promise<void> {
    try {
      totalCount.value = await fetchCommentsCount(options.section, options.url);
    } catch {
      // Счётчик обновится при следующей загрузке ленты.
    }
  }

  /**
   * Рекурсивно догружает поддерево ответов: на каждый узел с ответами уходит
   * отдельный запрос (сервис отдаёт только прямых детей). Глубина ограничена
   * предохранителем — хвост догрузится кнопкой уже внутри ветки.
   * Верхний узел не разворачивается — этим управляет вызывающий (клик или
   * фоновый префетч); внутренние узлы разворачиваются сразу, чтобы клик
   * показал всё поддерево.
   * @param node Узел, для которого загружаются ответы.
   * @param depth Текущая глубина рекурсии.
   */
  async function loadRepliesDeep(
    node: CommentNode,
    depth: number,
  ): Promise<void> {
    if (depth >= COMMENTS_REPLIES_DEPTH_LIMIT) {
      return;
    }

    const replies = await fetchCommentReplies(node.comment.id);

    node.replies = replies.map((reply) =>
      createCommentNode(reply, node.comment.authorName),
    );

    node.repliesLoaded = true;

    if (depth > 0) {
      node.repliesExpanded = true;
    }

    await Promise.all(
      node.replies
        .filter((child) => !child.repliesLoaded)
        .map((child) => loadRepliesDeep(child, depth + 1)),
    );
  }

  /**
   * Загрузки веток в полёте (ключ — id комментария). Дедупликация нужна,
   * чтобы клик по ветке во время фонового префетча не запускал второй
   * набор тех же запросов, а дожидался уже идущего.
   */
  const repliesLoadPromises = new Map<string, Promise<void>>();

  /**
   * Гарантирует, что поддерево ответов узла загружено. Повторные вызовы
   * во время загрузки возвращают уже идущий Promise.
   */
  function ensureRepliesLoaded(node: CommentNode): Promise<void> {
    if (node.repliesLoaded) {
      return Promise.resolve();
    }

    const inFlight = repliesLoadPromises.get(node.comment.id);

    if (inFlight) {
      return inFlight;
    }

    const loadPromise = (async () => {
      node.repliesLoading = true;

      try {
        await loadRepliesDeep(node, 0);
      } finally {
        node.repliesLoading = false;
        repliesLoadPromises.delete(node.comment.id);
      }
    })();

    repliesLoadPromises.set(node.comment.id, loadPromise);

    return loadPromise;
  }

  /**
   * Кнопка «Показать/Скрыть ответы»: первая загрузка тянет всё поддерево,
   * дальше работает как свёртка без перезапросов.
   */
  async function toggleReplies(node: CommentNode): Promise<void> {
    if (node.repliesLoaded) {
      node.repliesExpanded = !node.repliesExpanded;

      return;
    }

    try {
      await ensureRepliesLoaded(node);
      node.repliesExpanded = true;
    } catch (error) {
      notifyError(error, 'Не удалось загрузить ответы');
    }
  }

  /**
   * Фоновая догрузка веток корней без разворачивания — чтобы кнопки сразу
   * показывали точное число ответов, когда сервис сообщает только прямых
   * детей. Если сервис присылает `totalReplyCount`, точное число уже есть —
   * дорогая догрузка пропускается. Ветки грузятся последовательно; ошибки
   * не показываются — число появится после явного раскрытия ветки.
   */
  async function prefetchReplyCounts(): Promise<void> {
    const pendingRoots = rootNodes.value.filter(
      (root) =>
        !root.repliesLoaded
        && root.comment.replyCount > 0
        && !hasServerReplyTotal(root.comment),
    );

    for (const root of pendingRoots) {
      try {
        await ensureRepliesLoaded(root);
      } catch {
        // Ветка догрузится по клику — фоновый сбой не показываем.
      }
    }
  }

  /**
   * Создаёт корневой комментарий и показывает его сверху ленты.
   * @returns true при успехе — форма очищается.
   */
  async function submitRootComment(content: string): Promise<boolean> {
    try {
      const created = await createRootComment({
        section: options.section,
        url: options.url,
        content,
      });

      rootNodes.value = [createCommentNode(created, null), ...rootNodes.value];
      totalCount.value += 1;
      startCooldown(COMMENT_SUBMIT_COOLDOWN_SECONDS);

      return true;
    } catch (error) {
      notifySubmitError(error, 'Не удалось отправить комментарий');

      return false;
    }
  }

  /**
   * Создаёт ответ на комментарий. Если ветка ещё не загружена — догружает её
   * целиком, свежий ответ приедет вместе с остальными.
   * @returns true при успехе — форма ответа закрывается.
   */
  async function submitReply(
    node: CommentNode,
    content: string,
  ): Promise<boolean> {
    try {
      const created = await createCommentReply(node.comment.id, {
        section: options.section,
        url: options.url,
        content,
      });

      node.comment = {
        ...node.comment,
        replyCount: node.comment.replyCount + 1,
      };

      totalCount.value += 1;

      if (node.repliesLoaded) {
        node.replies = [
          ...node.replies,
          createCommentNode(created, node.comment.authorName),
        ];

        node.repliesExpanded = true;
      } else {
        await toggleReplies(node);
      }

      startCooldown(COMMENT_SUBMIT_COOLDOWN_SECONDS);

      return true;
    } catch (error) {
      notifySubmitError(error, 'Не удалось отправить ответ');

      return false;
    }
  }

  /**
   * Сохраняет новый текст своего комментария.
   * @returns true при успехе — форма правки закрывается.
   */
  async function submitEdit(
    node: CommentNode,
    content: string,
  ): Promise<boolean> {
    try {
      const updated = await updateComment(node.comment.id, content);

      node.comment = {
        ...node.comment,
        content: updated.content,
        editedAt: updated.editedAt,
      };

      return true;
    } catch (error) {
      const title =
        getCommentFetchStatus(error) === 409
          ? 'Комментарий уже удалён'
          : 'Не удалось сохранить изменения';

      notifyError(error, title);

      return false;
    }
  }

  /**
   * Мягко удаляет свой комментарий. Сервис прячет из выдачи всю ветку —
   * локально убираем узел с поддеревом и перечитываем счётчик с сервера
   * (размер скрытой ветки локально не известен).
   * @returns true при успехе — диалог подтверждения закрывается.
   */
  async function removeComment(node: CommentNode): Promise<boolean> {
    try {
      await deleteComment(node.comment.id);

      const { parentId } = node.comment;

      removeCommentNode(rootNodes.value, node.comment.id);

      if (parentId) {
        const parentNode = findCommentNode(rootNodes.value, parentId);

        if (parentNode) {
          parentNode.comment = {
            ...parentNode.comment,
            replyCount: Math.max(parentNode.comment.replyCount - 1, 0),
          };
        }
      }

      await refreshCount();

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось удалить комментарий');

      return false;
    }
  }

  /**
   * Отправляет жалобу на комментарий. 409 означает «уже жаловались» (или
   * комментарий удалён) — запоминаем и в этом случае, чтобы погасить кнопку.
   */
  async function submitReport(node: CommentNode): Promise<void> {
    if (reportedCommentIds.value.has(node.comment.id)) {
      return;
    }

    try {
      const updated = await reportComment(node.comment.id);

      node.comment = {
        ...node.comment,
        dislikeCount: updated.dislikeCount,
      };

      markReported(node.comment.id);

      toast.add({
        title: 'Жалоба отправлена',
        description: 'Спасибо! Модераторы посмотрят на этот комментарий.',
        color: 'success',
        icon: 'tabler:flag',
      });
    } catch (error) {
      if (getCommentFetchStatus(error) === 409) {
        markReported(node.comment.id);

        toast.add({
          title: 'Жалоба уже учтена',
          description: 'На этот комментарий вы уже жаловались.',
          color: 'info',
          icon: 'tabler:flag',
        });

        return;
      }

      notifyError(error, 'Не удалось отправить жалобу');
    }
  }

  /**
   * Запоминает жалобу в рамках сессии (иммутабельная замена Set,
   * чтобы computed-подписчики гарантированно пересчитались).
   */
  function markReported(commentId: string): void {
    reportedCommentIds.value = new Set([
      ...reportedCommentIds.value,
      commentId,
    ]);
  }

  /**
   * Разворачивает свёрнутых предков комментария, чтобы он оказался видим
   * (после фонового префетча верхние узлы веток остаются свёрнутыми).
   */
  function expandCommentAncestors(commentId: string): void {
    let currentNode = findCommentNode(rootNodes.value, commentId);

    // Подъём по parentId завершается на корне (parentId = null).
    while (currentNode?.comment.parentId) {
      const parentNode = findCommentNode(
        rootNodes.value,
        currentNode.comment.parentId,
      );

      if (!parentNode) {
        break;
      }

      parentNode.repliesExpanded = true;
      currentNode = parentNode;
    }
  }

  /**
   * Комментарий вне загруженной части ленты: поднимаемся по цепочке до его
   * корня, вставляем корень сверху ленты («ветка по ссылке») и догружаем её.
   * Дедуп в `loadMoreComments` не даст корню задвоиться при листании.
   * @returns true, если ветка с комментарием загрузилась.
   */
  async function revealCommentFromDistantPage(
    commentId: string,
  ): Promise<boolean> {
    try {
      const rootEntry = await fetchRootOfComment(
        commentId,
        options.section,
        options.url,
      );

      if (!rootEntry) {
        return false;
      }

      if (!findCommentNode(rootNodes.value, rootEntry.id)) {
        rootNodes.value = [
          createCommentNode(rootEntry, null),
          ...rootNodes.value,
        ];
      }

      const rootNode = findCommentNode(rootNodes.value, rootEntry.id);

      if (rootNode) {
        await ensureRepliesLoaded(rootNode).catch(() => undefined);
      }

      return !!findCommentNode(rootNodes.value, commentId);
    } catch {
      // 404 — комментарий удалён или ссылка битая; тихо остаёмся на ленте.
      return false;
    }
  }

  /**
   * Готовит комментарий к показу по якорной ссылке: догружает ветки корней
   * текущей страницы, а если цель не нашлась (корень на дальней странице
   * пагинации) — поднимает её ветку по id и вставляет сверху ленты.
   * Затем разворачивает предков цели.
   * @param commentId Идентификатор комментария из якоря.
   * @returns true, если комментарий найден в дереве.
   */
  async function revealComment(commentId: string): Promise<boolean> {
    if (!findCommentNode(rootNodes.value, commentId)) {
      const unloadedRoots = rootNodes.value.filter(
        (root) => !root.repliesLoaded && root.comment.replyCount > 0,
      );

      await Promise.all(
        unloadedRoots.map((root) =>
          ensureRepliesLoaded(root).catch(() => undefined),
        ),
      );
    }

    if (!findCommentNode(rootNodes.value, commentId)) {
      const revealed = await revealCommentFromDistantPage(commentId);

      if (!revealed) {
        return false;
      }
    }

    expandCommentAncestors(commentId);

    return true;
  }

  /**
   * Свой ли комментарий: сравнение UUID автора с клеймом `sub` токена
   * (приходит с `/api/auth/me` полем `id`).
   */
  function isOwnComment(node: CommentNode): boolean {
    return !!user.value?.id && user.value.id === node.comment.authorId;
  }

  /**
   * Отправлял ли пользователь жалобу на комментарий в этой сессии.
   */
  function isCommentReported(commentId: string): boolean {
    return reportedCommentIds.value.has(commentId);
  }

  return {
    rootNodes,
    totalCount,
    latestComment,
    isLoading,
    isPreviewLoading,
    isLoadingMore,
    isLastPage,
    loadError,

    loadPreview,
    loadComments,
    loadMoreComments,
    toggleReplies,
    revealComment,
    submitRootComment,
    submitReply,
    submitEdit,
    removeComment,
    submitReport,
    isOwnComment,
    isCommentReported,
  };
}
