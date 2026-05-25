import type { ComputedRef, Ref } from 'vue';

import type { FetchStatusValue } from '~/shared/consts';

import { useLayoutWidth } from '~/composables/useLayoutWidth';
import { FetchStatus } from '~/shared/consts';
import { createLruCache } from '~/utils/createLruCache';
import { getOrigin } from '~/utils/getOrigin';

export interface UseSectionDetailOptions {
  /** Базовый путь раздела (например, '/classes') */
  sectionPath: string;
  /** Базовый путь API для загрузки сущности (например, '/api/v2/classes') */
  apiBasePath: string;
  /** Список элементов раздела для автоматического выбора первого */
  items: Ref<Array<{ url: string }> | null | undefined>;
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
  options: UseSectionDetailOptions,
): UseSectionDetailReturn<TDetail> {
  const route = useRoute();
  const router = useRouter();
  const { isSplitActive } = useLayoutWidth();

  const detailCache = createLruCache<string, TDetail>(50);

  const detailUrl = computed(() => {
    const detail = route.query.detail;

    return typeof detail === 'string' && detail ? detail : '';
  });

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
      router.replace({
        query: {
          ...route.query,
          detail: undefined,
        },
      });

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
