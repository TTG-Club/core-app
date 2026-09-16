import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

import type { FetchStatusValue } from '~/shared/consts';

import { omit } from 'es-toolkit';

import { useLayoutWidth } from '~/composables/useLayoutWidth';
import { FetchStatus } from '~/shared/consts';
import { createLruCache } from '~/utils/createLruCache';
import { getOrigin } from '~/utils/getOrigin';

export interface UseSectionDetailOptions<TDetail = unknown> {
  /** Базовый путь раздела (например, '/classes') */
  sectionPath: string;
  /** Базовый путь API для загрузки сущности (например, '/api/v2/classes') */
  apiBasePath: string;
  /** Список элементов раздела для автоматического выбора первого */
  items: Ref<Array<{ url: string }> | null | undefined>;
  /**
   * Извлекает URL родительского элемента из детальных данных.
   * Используется для сохранения выделения основного элемента в списке
   * при выборе дочернего (например, подкласса).
   */
  getParentUrl?: (detail: TDetail) => string | undefined;
  /**
   * Есть ли у списка ещё не загруженные страницы. Пока они есть, отсутствие
   * открытой записи в загруженной части ничего не значит: она может найтись
   * дальше. Спискам без пагинации не задаётся.
   */
  hasMoreItems?: MaybeRefOrGetter<boolean>;
}

export interface UseSectionDetailReturn<TDetail> {
  /** URL детального просмотра из query.detail */
  detailUrl: ComputedRef<string>;
  /** Данные детального просмотра сущности */
  detailData: Ref<TDetail | null>;
  /** Статус загрузки детальных данных */
  detailStatus: Ref<FetchStatusValue>;
  /** Флаг, показывающий, идет ли загрузка */
  isDetailLoading: ComputedRef<boolean>;
  /** Флаг, показывающий, произошла ли ошибка при загрузке */
  isDetailError: ComputedRef<boolean>;
  /** Флаг, показывающий, закрыл ли пользователь панель */
  isDetailDismissed: Ref<boolean>;
  /** Ссылка на детальную страницу для копирования */
  detailUrlForCopy: ComputedRef<string | undefined>;
  /** Ссылка на страницу редактирования в мастерской */
  detailEditUrl: ComputedRef<string | undefined>;
  /** Обработчик закрытия детальной панели */
  handleCloseDetail: () => void;
}

/**
 * Универсальный composable для управления детальной панелью в широком режиме (Wide Mode).
 * Инкапсулирует загрузку данных с кэшированием, обработку query-параметров, редиректы,
 * автовыбор первого элемента и SEO-метаданные.
 *
 * Сам меняет `detail` в адресе: после смены фильтров или поиска карточка
 * записи, выпавшей из выдачи, переключается на первую запись нового списка.
 *
 * @param options Параметры конфигурации раздела.
 * @returns Набор реактивных переменных и методов для управления детальной панелью.
 */
export function useSectionDetail<TDetail>(
  options: UseSectionDetailOptions<TDetail>,
): UseSectionDetailReturn<TDetail> {
  const route = useRoute();
  const router = useRouter();
  const { isSplitActive } = useLayoutWidth();

  const detailParentUrl = useState<string | undefined>(
    'section-detail-parent-url',
    () => undefined,
  );

  const detailCache = createLruCache<string, TDetail>(50);

  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

  /**
   * Путь детальной страницы для узкого режима (например, '/classes/bard-phb').
   * Используется для редиректа с query.detail на отдельную страницу,
   * когда сплит-режим неактивен (зеркальный к useSectionDetailRedirect случай).
   */
  const detailPagePath = computed(
    () => `${options.sectionPath}/${detailUrl.value}`,
  );

  // Серверный redirect: если сплит-режим неактивен, но в query есть detail
  // (например, открыли расшаренную из Wide Mode ссылку в узком режиме),
  // сразу перенаправляем на отдельную детальную страницу.
  if (import.meta.server && !isSplitActive.value && detailUrl.value) {
    navigateTo(detailPagePath.value, { replace: true, redirectCode: 302 });
  }

  const detailData = shallowRef<TDetail | null>(null);
  const detailStatus = ref<FetchStatusValue>(FetchStatus.Idle);
  const isDetailDismissed = ref(false);
  const isRouterReady = ref(false);

  /**
   * Загружает детальные данные сущности по её URL-идентификатору.
   * Использует кэширование во избежание повторных запросов.
   *
   * @param url Идентификатор сущности.
   */
  async function fetchDetail(url: string): Promise<void> {
    if (!url) {
      detailData.value = null;
      detailStatus.value = FetchStatus.Idle;

      return;
    }

    if (detailCache.has(url)) {
      detailData.value = detailCache.get(url) || null;
      detailStatus.value = FetchStatus.Success;

      return;
    }

    detailStatus.value = FetchStatus.Pending;

    try {
      const response = (await $fetch<TDetail>(
        `${options.apiBasePath}/${url}`,
      )) as TDetail;

      detailCache.set(url, response);
      detailData.value = response;
      detailStatus.value = FetchStatus.Success;
    } catch {
      detailData.value = null;
      detailStatus.value = FetchStatus.Error;
    }
  }

  watch(
    detailUrl,
    (url) => {
      if (url) {
        isDetailDismissed.value = false;
      }

      fetchDetail(url);
    },
    { immediate: true },
  );

  watch(detailData, (detail) => {
    detailParentUrl.value =
      detail && options.getParentUrl ? options.getParentUrl(detail) : undefined;
  });

  const isDetailLoading = computed(
    () => detailStatus.value === FetchStatus.Pending,
  );

  const isDetailError = computed(
    () => detailStatus.value === FetchStatus.Error,
  );

  const detailUrlForCopy = computed(() =>
    detailUrl.value
      ? `${getOrigin()}${options.sectionPath}/${detailUrl.value}`
      : undefined,
  );

  const detailEditUrl = computed(() =>
    detailUrl.value
      ? `/workshop${options.sectionPath}/${detailUrl.value}`
      : undefined,
  );

  watch(isSplitActive, (splitActive) => {
    if (isRouterReady.value && !splitActive && detailUrl.value) {
      router.replace({
        query: {
          ...route.query,
          detail: undefined,
        },
      });
    }
  });

  /**
   * Автоматически выбирает первый элемент из списка, если активен сплит-режим
   * и пользователь еще не закрывал панель вручную.
   */
  function autoSelectFirst(): void {
    if (!isSplitActive.value || isDetailDismissed.value) {
      return;
    }

    const firstItem = options.items.value?.[0];

    if (firstItem && !route.query.detail) {
      router.replace({
        query: {
          ...route.query,
          detail: firstItem.url,
        },
      });
    }
  }

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailUrl.value) {
      // Якорь сохраняется: deep-link на комментарий должен пережить редирект.
      router.replace({ path: detailPagePath.value, hash: route.hash });

      return;
    }

    autoSelectFirst();
  });

  watch([options.items, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirst();
    }
  });

  // Запрос списка — весь query, кроме самой карточки: фильтры, источники и
  // поиск синхронизируются в адрес.
  const listQuery = computed(() =>
    JSON.stringify(omit(route.query, ['detail'])),
  );

  // Флаг, а не проверка на месте: адрес меняется сразу, а новая выдача
  // приходит позже.
  let isListCheckPending = false;

  watch(listQuery, () => {
    isListCheckPending = true;
  });

  /**
   * Есть ли открытая запись в загруженном списке — сама или её родитель
   * (подкласс показан в списке своим классом).
   */
  function isDetailListed(): boolean {
    const listedUrls = new Set(
      options.items.value?.map((listedEntity) => listedEntity.url),
    );

    if (listedUrls.has(detailUrl.value)) {
      return true;
    }

    return (
      !!options.getParentUrl
      && !!detailParentUrl.value
      && listedUrls.has(detailParentUrl.value)
    );
  }

  /**
   * После смены фильтров или поиска сверяет открытую карточку с новой выдачей.
   *
   * Запись, которую фильтр убрал из списка, уступает место первой записи
   * выдачи: иначе справа оставалась бы, например, запись снятого источника, и
   * казалось бы, что фильтр не сработал. При первой загрузке проверки нет —
   * расшаренная ссылка открывает свою запись, даже если та не проходит фильтры
   * получателя.
   */
  function syncDetailWithList(): void {
    if (!isListCheckPending || !isRouterReady.value || !options.items.value) {
      return;
    }

    if (!isSplitActive.value || !detailUrl.value) {
      isListCheckPending = false;

      return;
    }

    // Родитель подзаписи известен только по её загруженным данным.
    if (options.getParentUrl && isDetailLoading.value) {
      return;
    }

    if (isDetailListed()) {
      isListCheckPending = false;

      return;
    }

    if (toValue(options.hasMoreItems)) {
      return;
    }

    // Флаг снимается до смены `detail`, и на этом цикл обрывается: новая
    // карточка грузится, меняет `detailParentUrl`, вотчер снова зовёт
    // проверку — но она выходит на первом же условии.
    isListCheckPending = false;

    const firstEntity = options.items.value[0];

    // Пустая выдача: вместо вечной заглушки загрузки — «запись не выбрана».
    if (!firstEntity) {
      isDetailDismissed.value = true;
    }

    router.replace({
      query: {
        ...route.query,
        detail: firstEntity?.url,
      },
    });
  }

  watch(
    [options.items, () => toValue(options.hasMoreItems), detailParentUrl],
    syncDetailWithList,
  );

  /**
   * Закрывает детальную панель и очищает query-параметр detail.
   */
  function handleCloseDetail(): void {
    isDetailDismissed.value = true;

    router.push({
      query: {
        ...route.query,
        detail: undefined,
      },
    });
  }

  useHead(() => {
    if (isSplitActive.value && detailUrl.value) {
      return {
        link: [
          {
            rel: 'canonical',
            href: `${getOrigin()}${options.sectionPath}/${detailUrl.value}`,
          },
        ],
      };
    }

    return {};
  });

  return {
    detailUrl,
    detailData,
    detailStatus,
    isDetailLoading,
    isDetailError,
    isDetailDismissed,
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
  };
}
