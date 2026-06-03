import type { ComputedRef, Ref } from 'vue';

import type { FetchStatusValue } from '~/shared/consts';

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
      const response = await $fetch<TDetail>(`${options.apiBasePath}/${url}`);

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
      router.replace(detailPagePath.value);

      return;
    }

    autoSelectFirst();
  });

  watch([options.items, isSplitActive], () => {
    if (isRouterReady.value) {
      autoSelectFirst();
    }
  });

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
