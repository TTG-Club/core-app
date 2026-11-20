import type { ComputedRef, Ref, WritableComputedRef } from 'vue';

import type {
  BugCountByStatusResponse,
  BugReportStatus,
  BugReportType,
  MyBugReportResponse,
  PageMyBugReportResponse,
} from '../../model';

import { getFetchStatus } from '~initiative/model';

import { useMyBugStatusCounts } from '../../composables';
import {
  BUG_REPORT_MY_API_URL,
  BUG_REPORT_MY_COUNT_API_URL,
  BUG_REPORT_TYPE_QUERY_KEY,
  getBugReportWithdrawErrorText,
  getMyBugReportApiUrl,
  isBugReportWithdrawOutdated,
  MY_BUGS_LIST_DATA_KEY,
  MY_BUGS_PAGE_SIZE,
  MY_BUGS_SORT,
  MY_BUGS_WITHDRAW_ERROR_TITLE,
  MY_BUGS_WITHDRAW_SUCCESS_TITLE,
  MY_WISHES_STATUS_COUNTS_DATA_KEY,
  parseBugReportTypeQuery,
  toBugReportTypeQuery,
} from '../../model';

/** Описание возвращаемого значения композабла useMyBugReports. */
export interface UseMyBugReportsReturn {
  /** Баг-репорты текущей страницы списка */
  bugReports: ComputedRef<MyBugReportResponse[]>;

  /** Количество записей выбранного типа в разрезе статусов */
  statusCounts: ComputedRef<BugCountByStatusResponse[]>;

  /** Номер текущей страницы, начиная с единицы */
  currentPage: Ref<number>;

  /** Выбранный статус; `null` — показаны все репорты */
  statusFilter: Ref<BugReportStatus | null>;

  /** Выбранный тип записей: баги или пожелания (хранится в адресе) */
  typeFilter: WritableComputedRef<BugReportType>;

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

  /**
   * Отозвать свой репорт. Возвращает `true`, если сервис его удалил; об
   * исходе в любом случае сообщает уведомлением.
   */
  withdrawBugReport: (bugReport: MyBugReportResponse) => Promise<boolean>;
}

/**
 * Баг-репорты текущего пользователя: страница списка, сводка по статусам и
 * фильтры. `statusFilter` равный `null` означает «все статусы»; `typeFilter`
 * переключает баги и пожелания и живёт в адресе (`?type=wish`), чтобы на
 * раздел пожеланий можно было дать ссылку.
 */
export function useMyBugReports(): UseMyBugReportsReturn {
  const requestFetch = useRequestFetch();
  const toast = useToast();
  const route = useRoute();
  const router = useRouter();

  const currentPage = ref(1);
  const statusFilter: Ref<BugReportStatus | null> = ref(null);

  const typeFilter = computed<BugReportType>({
    get: () => parseBugReportTypeQuery(route.query[BUG_REPORT_TYPE_QUERY_KEY]),
    set: (type) => {
      router.replace({
        query: {
          ...route.query,
          [BUG_REPORT_TYPE_QUERY_KEY]: toBugReportTypeQuery(type),
        },
      });
    },
  });

  // Смена фильтра обнуляет страницу: на третьей странице «всех» репортов может
  // не быть ни одного репорта выбранного статуса, и список оказался бы пустым.
  // Watcher объявлен до useAsyncData намеренно: Vue вызывает наблюдатели в
  // порядке создания, поэтому страница успевает сброситься до запроса, и
  // фильтр не запрашивает несуществующую страницу.
  watch([statusFilter, typeFilter], () => {
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
            type: typeFilter.value,
          },
        }),
      { server: false, watch: [currentPage, statusFilter, typeFilter] },
    );

  // Сводка не зависит от выбранного статуса: цифры на плитках должны оставаться
  // на месте после клика по одной из них, иначе фильтр «съедал» бы сам себя.
  // Сводка багов общая с плиткой исправленных багов в сайдбаре — один запрос
  // на всех. Сводку пожеланий спрашиваем только на вкладке пожеланий.
  const { statusCounts: bugStatusCounts, refresh: refreshBugStatusCounts } =
    useMyBugStatusCounts();

  const isWishesSelected = computed(() => typeFilter.value === 'WISH');

  const { data: wishStatusCounts, refresh: refreshWishStatusCounts } =
    useAsyncData<BugCountByStatusResponse[]>(
      MY_WISHES_STATUS_COUNTS_DATA_KEY,
      () =>
        requestFetch<BugCountByStatusResponse[]>(BUG_REPORT_MY_COUNT_API_URL, {
          query: { type: 'WISH' satisfies BugReportType },
        }),
      { default: () => [], server: false, immediate: false },
    );

  // Сводка пожеланий нужна только на их вкладке: пока открыты баги, лишний
  // запрос не уходит. Перечитываем при каждом входе — пока смотрели баги,
  // статусы пожеланий могли смениться. Только на клиенте — как и остальные
  // приватные данные раздела (`server: false` не мешает ручному refresh).
  watchImmediate(isWishesSelected, (isSelected) => {
    if (isSelected && import.meta.client) {
      void refreshWishStatusCounts();
    }
  });

  const statusCounts = computed(() =>
    isWishesSelected.value ? wishStatusCounts.value : bugStatusCounts.value,
  );

  /** Перечитывает сводку выбранного типа. */
  function refreshStatusCounts(): Promise<void> {
    return isWishesSelected.value
      ? refreshWishStatusCounts()
      : refreshBugStatusCounts();
  }

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

  /**
   * Перечитывает список после того, как из него ушла запись. Если она была
   * последней на странице (не первой), шаг назад: смена страницы сама
   * перезапросит список через `watch` у useAsyncData, остаётся сводка.
   */
  async function reloadAfterRemoval(): Promise<void> {
    if (bugReports.value.length <= 1 && currentPage.value > 1) {
      currentPage.value -= 1;
      await refreshStatusCounts();

      return;
    }

    await reload();
  }

  /**
   * Отзывает репорт автором. После успеха и после отказа список и сводка
   * перечитываются: при 409 у репорта уже другой статус, при 404 его нет —
   * в обоих случаях на экране устаревшая картина.
   *
   * @param bugReport Отзываемый репорт.
   */
  async function withdrawBugReport(
    bugReport: MyBugReportResponse,
  ): Promise<boolean> {
    try {
      await requestFetch(getMyBugReportApiUrl(bugReport.id), {
        method: 'DELETE',
      });
    } catch (withdrawError: unknown) {
      const errorStatus = getFetchStatus(withdrawError);

      toast.add({
        title: MY_BUGS_WITHDRAW_ERROR_TITLE,
        description: getBugReportWithdrawErrorText(errorStatus),
        color: 'error',
      });

      if (isBugReportWithdrawOutdated(errorStatus)) {
        void reload();
      }

      return false;
    }

    toast.add({ title: MY_BUGS_WITHDRAW_SUCCESS_TITLE, color: 'success' });
    void reloadAfterRemoval();

    return true;
  }

  return {
    bugReports,
    statusCounts,
    currentPage,
    statusFilter,
    typeFilter,
    totalCount,
    totalStatusCount,
    isLoading,
    hasError,
    reload,
    withdrawBugReport,
  };
}
