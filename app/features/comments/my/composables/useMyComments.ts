import type { ComputedRef, Ref } from 'vue';

import type { CommentsPage, MyComment, MyCommentsFilter } from '../../model';

import { StatusCodes } from 'http-status-codes';

import {
  fetchMyComments,
  getCommentFetchStatus,
  MY_COMMENTS_LIST_DATA_KEY,
  MY_COMMENTS_PAGE_SIZE,
} from '../../model';
import { useMyCommentUpdates } from './useMyCommentUpdates';

/** Описание возвращаемого значения композабла useMyComments. */
export interface UseMyCommentsReturn {
  /** Свои комментарии текущей страницы списка */
  comments: ComputedRef<MyComment[]>;

  /** Номер текущей страницы, начиная с единицы */
  currentPage: Ref<number>;

  /** Выбранный фильтр списка */
  filter: Ref<MyCommentsFilter>;

  /** Количество комментариев с учётом фильтра — для пагинации */
  totalCount: ComputedRef<number>;

  /** Идёт ли загрузка списка */
  isLoading: ComputedRef<boolean>;

  /** Завершилась ли загрузка ошибкой */
  hasError: ComputedRef<boolean>;

  /** Перезагрузить список */
  reload: () => Promise<void>;
}

/** Пустая страница — ответ на «раздела у сервиса ещё нет». */
const EMPTY_PAGE: CommentsPage<MyComment> = {
  items: [],
  totalElements: 0,
  last: true,
};

/**
 * Свои комментарии в профиле: страница списка и фильтр.
 *
 * Отметка просмотра берётся снимком на момент открытия раздела и дальше не
 * меняется: она же определяет, какие ответы считаются новыми, и живая отметка
 * вымывала бы карточки из фильтра «Новые ответы» прямо во время чтения.
 */
export function useMyComments(): UseMyCommentsReturn {
  const { seenAt } = useMyCommentUpdates();

  const sinceSnapshot = seenAt.value;

  const currentPage = ref(1);
  const filter: Ref<MyCommentsFilter> = ref('ALL');

  // Смена фильтра обнуляет страницу: на третьей странице «всех» комментариев
  // может не быть ни одного с новыми ответами, и список оказался бы пустым.
  // Watcher объявлен до useAsyncData намеренно: Vue вызывает наблюдатели в
  // порядке создания, поэтому страница успевает сброситься до запроса.
  watch(filter, () => {
    currentPage.value = 1;
  });

  // server: false — приватные данные пользователя грузим на клиенте, где
  // авторизация (cookie → Bearer → микросервис) гарантированно работает.
  const { data, status, error, refresh } = useAsyncData<
    CommentsPage<MyComment>
  >(
    MY_COMMENTS_LIST_DATA_KEY,
    async () => {
      try {
        return await fetchMyComments(
          filter.value,
          sinceSnapshot,
          currentPage.value - 1,
          MY_COMMENTS_PAGE_SIZE,
        );
      } catch (requestError: unknown) {
        // Сборка сервиса без раздела профиля отвечает 404. Это «здесь пока
        // пусто», а не поломка: показывать ошибку пользователю не за что.
        if (getCommentFetchStatus(requestError) === StatusCodes.NOT_FOUND) {
          return EMPTY_PAGE;
        }

        throw requestError;
      }
    },
    { server: false, watch: [currentPage, filter] },
  );

  const comments = computed<MyComment[]>(() => data.value?.items ?? []);

  const totalCount = computed(() => data.value?.totalElements ?? 0);

  // `idle` — тоже загрузка: с `server: false` запрос стартует только на
  // клиенте, и без этого статуса разметка успевала показать «комментариев
  // нет» до первого обращения к сервису.
  const isLoading = computed(
    () => status.value === 'idle' || status.value === 'pending',
  );

  const hasError = computed(() => !!error.value);

  /** Перезагружает список — например, после ошибки. */
  async function reload(): Promise<void> {
    await refresh();
  }

  return {
    comments,
    currentPage,
    filter,
    totalCount,
    isLoading,
    hasError,
    reload,
  };
}
