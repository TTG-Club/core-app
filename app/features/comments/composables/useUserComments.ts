import type { ComputedRef, Ref } from 'vue';

import type { CommentEntry } from '../model';

import {
  COMMENTS_LOAD_ERROR_TOAST,
  fetchUserComments,
  getCommentErrorMessage,
  mergeRestoredComment,
} from '../model';

/** Возвращаемое значение композабла useUserComments. */
export interface UseUserCommentsReturn {
  /** Загруженные комментарии автора: все статусы вперемешку, свежие сверху. */
  comments: Ref<Array<CommentEntry>>;

  /** Общее число комментариев автора по данным сервиса. */
  totalCount: Ref<number>;

  /** Идёт первая загрузка списка. */
  isLoading: Ref<boolean>;

  /** Идёт догрузка следующей страницы. */
  isLoadingMore: Ref<boolean>;

  /** У сервиса есть ещё страницы — кнопка догрузки имеет смысл. */
  hasMore: ComputedRef<boolean>;

  /** Загружено меньше, чем есть у автора: счётчики неполные. */
  isPartiallyLoaded: ComputedRef<boolean>;

  /** Ошибка последней загрузки; `null` — последняя попытка удалась. */
  loadError: Ref<unknown>;

  /** Человекочитаемый текст ошибки (пустая строка, если ошибки нет). */
  loadErrorMessage: ComputedRef<string>;

  /** Загружает первую страницу (он же повтор после сбоя). */
  load: () => Promise<void>;

  /** Дописывает следующую страницу к загруженным. */
  loadMore: () => Promise<void>;

  /** Переводит комментарий в удалённые локально. */
  markCommentDeleted: (commentId: string) => void;

  /** Обновляет комментарий ответом сервиса на восстановление. */
  replaceComment: (restored: CommentEntry) => void;
}

/**
 * Комментарии одного автора для админ-детали пользователя.
 *
 * Тянет модерационную ленту с фильтром по `authorId` — она отдаёт все статусы
 * сразу, поэтому опубликованные и удалённые делятся по вкладкам уже на
 * клиенте. Грузится лениво, страницами, с накоплением.
 *
 * Автор читается заново на каждом запросе, но вотчера на него нет: список
 * загружается один раз при монтировании, а смену пользователя вызывающий код
 * обеспечивает перемонтированием блока (`:key` по id детали) — как у
 * useUserRedeemedCodes. Без перемонтирования `loadMore` дописал бы страницу
 * нового автора к списку старого.
 *
 * @param authorId UUID автора, чьи комментарии показываем.
 */
export function useUserComments(
  authorId: MaybeRefOrGetter<string>,
): UseUserCommentsReturn {
  const toast = useToast();

  const comments = ref<Array<CommentEntry>>([]);
  const totalCount = ref(0);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const isLastPage = ref(true);
  const nextPage = ref(0);
  const loadError = ref<unknown>(null);

  // Пользователя могли переключить, пока запрос был в пути. Ответ мёртвого
  // блока не должен писать в состояние и показывать тост поверх уже
  // открытого другого пользователя.
  let isScopeActive = true;

  onScopeDispose(() => {
    isScopeActive = false;
  });

  /** Загружены не все комментарии автора — доступна догрузка. */
  const hasMore = computed(() => !isLastPage.value);

  /**
   * Загружено меньше, чем есть у автора по данным сервиса. Отличается от
   * `hasMore`: страницы могли закончиться, а расхождение остаться — например,
   * когда дедупликация отсеяла сдвинутые записи.
   */
  const isPartiallyLoaded = computed(
    () => comments.value.length < totalCount.value,
  );

  /** Текст ошибки последней неудачной загрузки (для блока с повтором). */
  const loadErrorMessage = computed(() =>
    loadError.value ? getCommentErrorMessage(loadError.value) : '',
  );

  /**
   * Загружает страницу ленты: нулевая заменяет список, следующие дописывают.
   * Свежие комментарии автора могли сдвинуть серверную пагинацию — уже
   * показанные отфильтровываются по id (как в useCommentsSection). Признак
   * конца берём из `last`: после отсева длина списка до totalElements может
   * не дойти, и сравнение по длине оставило бы вечную кнопку «Показать ещё».
   * @param page Номер страницы (с нуля).
   */
  async function loadPage(page: number): Promise<void> {
    try {
      const commentsPage = await fetchUserComments(toValue(authorId), page);

      if (!isScopeActive) {
        return;
      }

      if (page === 0) {
        comments.value = commentsPage.items;
      } else {
        const knownIds = new Set(comments.value.map((entry) => entry.id));

        comments.value = [
          ...comments.value,
          ...commentsPage.items.filter((entry) => !knownIds.has(entry.id)),
        ];
      }

      totalCount.value = commentsPage.totalElements;
      isLastPage.value = commentsPage.last;
      nextPage.value = page + 1;
      loadError.value = null;
    } catch (error) {
      if (!isScopeActive) {
        return;
      }

      // Ошибку держим в состоянии, а не только в тосте: пустой список без неё
      // читается как «пользователь не оставлял комментариев» — это неправда.
      loadError.value = error;

      toast.add({
        title: COMMENTS_LOAD_ERROR_TOAST,
        description: getCommentErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    }
  }

  /** Загружает первую страницу комментариев автора (и повторяет после сбоя). */
  async function load(): Promise<void> {
    isLoading.value = true;

    try {
      await loadPage(0);
    } finally {
      isLoading.value = false;
    }
  }

  /** Дописывает следующую страницу к уже загруженным. */
  async function loadMore(): Promise<void> {
    // Двойной клик по «Показать ещё» иначе тянет одну страницу дважды.
    if (isLastPage.value || isLoadingMore.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      await loadPage(nextPage.value);
    } finally {
      isLoadingMore.value = false;
    }
  }

  /**
   * Переводит комментарий в удалённые локально: сервис на удаление отвечает
   * 204 без тела, а перечитывать накопленные страницы ради одного статуса
   * незачем.
   * @param commentId Идентификатор удалённого комментария.
   */
  function markCommentDeleted(commentId: string): void {
    comments.value = comments.value.map(
      (entry): CommentEntry =>
        entry.id === commentId ? { ...entry, status: 'DELETED' } : entry,
    );
  }

  /**
   * Обновляет комментарий ответом сервиса на восстановление. Поля, которых в
   * одиночном ответе может не быть, берутся из прежней записи: ссылка на
   * страницу и подпись «кому ответили» не должны пропадать после действия.
   * @param restored Комментарий из ответа сервиса.
   */
  function replaceComment(restored: CommentEntry): void {
    comments.value = comments.value.map(
      (entry): CommentEntry =>
        entry.id === restored.id
          ? mergeRestoredComment(entry, restored)
          : entry,
    );
  }

  return {
    comments,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    isPartiallyLoaded,
    loadError,
    loadErrorMessage,
    load,
    loadMore,
    markCommentDeleted,
    replaceComment,
  };
}
