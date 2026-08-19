import type { ComputedRef, Ref } from 'vue';

import type { CommentEntry, CommentsPage, PublicComment } from '../../model';

import { StatusCodes } from 'http-status-codes';

import {
  fetchRecentComments,
  filterLiveComments,
  getCommentFetchStatus,
  readWithoutStaleToken,
  RECENT_COMMENTS_DATA_KEY,
  RECENT_COMMENTS_LIMIT,
  RECENT_COMMENTS_PAGE_SIZE,
} from '../../model';

/** Описание возвращаемого значения композабла useRecentComments. */
export interface UseRecentCommentsReturn {
  /** Комментарии текущей страницы ленты */
  comments: ComputedRef<Array<CommentEntry>>;

  /** Номер текущей страницы, начиная с единицы */
  currentPage: Ref<number>;

  /** Количество комментариев в ленте с учётом её потолка — для пагинации */
  totalCount: ComputedRef<number>;

  /** Идёт ли загрузка ленты */
  isLoading: ComputedRef<boolean>;

  /** Завершилась ли загрузка ошибкой */
  hasError: ComputedRef<boolean>;

  /** Перезагрузить ленту */
  reload: () => Promise<void>;
}

/** Пустая страница — ответ на «ленты у сервиса ещё нет». */
const EMPTY_PAGE: CommentsPage<PublicComment> = {
  items: [],
  totalElements: 0,
  last: true,
};

/**
 * Лента последних комментариев сайта: страница списка и пагинация.
 *
 * Читается без входа, но протухший токен превращает публичную выдачу в 401 —
 * поэтому запрос идёт через `readWithoutStaleToken`, как и лента обсуждения
 * на странице сущности.
 */
export function useRecentComments(): UseRecentCommentsReturn {
  const currentPage = ref(1);

  // server: false — на сервере повтор после сброса куки не помогает (входящие
  // заголовки запроса те же), а на клиенте протухший токен снимается и чтение
  // проходит. Лента живая и меняется каждую минуту, отдавать её из SSR незачем.
  const { data, status, error, refresh } = useAsyncData<
    CommentsPage<PublicComment>
  >(
    RECENT_COMMENTS_DATA_KEY,
    async () => {
      try {
        return await readWithoutStaleToken(() =>
          fetchRecentComments(currentPage.value - 1, RECENT_COMMENTS_PAGE_SIZE),
        );
      } catch (requestError: unknown) {
        // Сборка сервиса без ленты отвечает 404. Это «здесь пока пусто»,
        // а не поломка: показывать ошибку пользователю не за что.
        if (getCommentFetchStatus(requestError) === StatusCodes.NOT_FOUND) {
          return EMPTY_PAGE;
        }

        throw requestError;
      }
    },
    { server: false, watch: [currentPage] },
  );

  const loadedComments = computed<Array<CommentEntry>>(() =>
    filterLiveComments(data.value?.items ?? []),
  );

  /**
   * Сколько комментариев ленты помещается на текущей странице до потолка.
   * Нужен на случай, когда размер страницы не делит потолок нацело: последняя
   * страница обрезается по остатку, а не выводит лишнее.
   */
  const remainingToLimit = computed(() =>
    Math.max(
      RECENT_COMMENTS_LIMIT
        - (currentPage.value - 1) * RECENT_COMMENTS_PAGE_SIZE,
      0,
    ),
  );

  const comments = computed<Array<CommentEntry>>(() =>
    loadedComments.value.slice(0, remainingToLimit.value),
  );

  // Пагинация считает по потолку ленты, а не по всей истории комментариев
  // сервиса: за сотней свежих записей листать нечего.
  const totalCount = computed(() =>
    Math.min(data.value?.totalElements ?? 0, RECENT_COMMENTS_LIMIT),
  );

  // `idle` — тоже загрузка: с `server: false` запрос стартует только на
  // клиенте, и без этого статуса разметка успевала показать пустое состояние
  // до первого обращения к сервису.
  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const hasError = computed(() => !!error.value);

  /** Перезагружает ленту — например, после ошибки. */
  async function reload(): Promise<void> {
    await refresh();
  }

  return {
    comments,
    currentPage,
    totalCount,
    isLoading,
    hasError,
    reload,
  };
}
