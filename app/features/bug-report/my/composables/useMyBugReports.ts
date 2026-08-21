import type { ComputedRef, Ref } from 'vue';

import type {
  BugCountByStatusResponse,
  BugReportStatus,
  MyBugReportResponse,
  PageMyBugReportResponse,
} from '../../model';

import { useMyBugStatusCounts } from '../../composables';
import {
  BUG_REPORT_MY_API_URL,
  MY_BUGS_LIST_DATA_KEY,
  MY_BUGS_PAGE_SIZE,
  MY_BUGS_SORT,
} from '../../model';

/** Описание возвращаемого значения композабла useMyBugReports. */
export interface UseMyBugReportsReturn {
  /** Баг-репорты текущей страницы списка */
  bugReports: ComputedRef<MyBugReportResponse[]>;

  /** Количество репортов в разрезе статусов */
  statusCounts: Ref<BugCountByStatusResponse[]>;

  /** Номер текущей страницы, начиная с единицы */
  currentPage: Ref<number>;

  /** Выбранный статус; `null` — показаны все репорты */
  statusFilter: Ref<BugReportStatus | null>;

  /** Количество репортов с учётом фильтра — для пагинации */
  totalCount: ComputedRef<number>;

  /** Общее количество репортов пользователя без учёта фильтра */
  totalStatusCount: ComputedRef<number>;

  /** Идёт ли загрузка списка */
  isLoading: ComputedRef<boolean>;

  /** Завершилась ли загрузка ошибкой */
  hasError: ComputedRef<boolean>;

  /** Перезагрузить список и сводку */
  reload: () => Promise<void>;
}

/**
 * Баг-репорты текущего пользователя: страница списка, сводка по статусам и
 * фильтр. `statusFilter` равный `null` означает «все статусы».
 */
export function useMyBugReports(): UseMyBugReportsReturn {
  const requestFetch = useRequestFetch();

  const currentPage = ref(1);
  const statusFilter: Ref<BugReportStatus | null> = ref(null);

  // Смена фильтра обнуляет страницу: на третьей странице «всех» репортов может
  // не быть ни одного репорта выбранного статуса, и список оказался бы пустым.
  // Watcher объявлен до useAsyncData намеренно: Vue вызывает наблюдатели в
  // порядке создания, поэтому страница успевает сброситься до запроса, и
  // фильтр не запрашивает несуществующую страницу.
  watch(statusFilter, () => {
    currentPage.value = 1;
  });

  // server: false — приватные данные пользователя грузим на клиенте, где
  // авторизация (cookie → Bearer → микросервис) гарантированно работает.
  const { data, status, error, refresh } =
    useAsyncData<PageMyBugReportResponse>(
      MY_BUGS_LIST_DATA_KEY,
      () =>
        requestFetch(BUG_REPORT_MY_API_URL, {
          query: {
            page: currentPage.value - 1,
            size: MY_BUGS_PAGE_SIZE,
            sort: MY_BUGS_SORT,
            status: statusFilter.value ?? undefined,
          },
        }),
      { server: false, watch: [currentPage, statusFilter] },
    );

  // Сводка не зависит от выбранного статуса: цифры на плитках должны оставаться
  // на месте после клика по одной из них, иначе фильтр «съедал» бы сам себя.
  // Источник общий с плиткой исправленных багов в сайдбаре — один запрос на всех.
  const { statusCounts, refresh: refreshStatusCounts } = useMyBugStatusCounts();

  const bugReports = computed<MyBugReportResponse[]>(
    () => data.value?.content ?? [],
  );

  const totalCount = computed(() => data.value?.totalElements ?? 0);

  /**
   * Общее число репортов пользователя без учёта фильтра. Статусы
   * взаимоисключающие и покрывают все репорты, поэтому сумма сводки и есть
   * общее число — отдельный запрос не нужен.
   */
  const totalStatusCount = computed(() =>
    statusCounts.value.reduce(
      (total, statusCount) => total + statusCount.count,
      0,
    ),
  );

  const isLoading = computed(() => status.value === 'pending');
  const hasError = computed(() => !!error.value);

  /** Перезагружает список и сводку — например, после ошибки. */
  async function reload(): Promise<void> {
    await Promise.all([refresh(), refreshStatusCounts()]);
  }

  return {
    bugReports,
    statusCounts,
    currentPage,
    statusFilter,
    totalCount,
    totalStatusCount,
    isLoading,
    hasError,
    reload,
  };
}
