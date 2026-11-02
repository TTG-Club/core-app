import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

import type { FetchStatusValue } from '~/shared/consts';
import type { DetailPaneNeighbours } from '~ui/detail-pane';

import { omit } from 'es-toolkit';

import { useLayoutWidth } from '~/composables/useLayoutWidth';
import { useSectionPaths } from '~/composables/useSectionNeighbours';
import { FetchStatus } from '~/shared/consts';
import { createLruCache } from '~/utils/createLruCache';
import { getOrigin } from '~/utils/getOrigin';
import { GALLERY_OPENED_STATE_KEY } from '~ui/gallery';

export interface UseSectionDetailOptions<TDetail = unknown> {
  /** Базовый путь раздела (например, '/classes') */
  sectionPath: string;
  /** Базовый путь API для загрузки сущности (например, '/api/v2/classes') */
  apiBasePath: string;
  /** Загруженные записи раздела: по ним карточка сверяется с выдачей */
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
  /** Ссылка на детальную страницу для копирования */
  detailUrlForCopy: ComputedRef<string | undefined>;
  /** Ссылка на страницу редактирования в мастерской */
  detailEditUrl: ComputedRef<string | undefined>;
  /** Обработчик закрытия детальной панели */
  handleCloseDetail: () => void;
  /** Соседи открытой записи в списке; нет — запись не из списка */
  detailNeighbours: ComputedRef<DetailPaneNeighbours | undefined>;
  /** Открывает запись раздела в панели */
  openDetail: (url: string) => void;
}

/** Элементы, где стрелки заняты своим делом: меню, списки, ползунки. */
const ARROW_KEYS_OWNER_SELECTOR =
  '[role="menu"], [role="listbox"], [role="dialog"], [role="slider"], [role="tablist"], [role="radiogroup"], [role="grid"]';

/**
 * Можно ли отдать нажатие стрелки листанию записей: без модификаторов, не в
 * поле ввода и не в элементе, которому стрелки нужны самому.
 *
 * @param event Нажатие клавиши.
 * @returns `true`, если стрелка свободна.
 */
function isFreeArrowKey(event: KeyboardEvent): boolean {
  if (
    event.defaultPrevented
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || event.shiftKey
  ) {
    return false;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return true;
  }

  if (
    target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return false;
  }

  return !target.closest(ARROW_KEYS_OWNER_SELECTOR);
}

/**
 * Универсальный composable для управления детальной панелью в широком режиме (Wide Mode).
 * Инкапсулирует загрузку данных с кэшированием, обработку query-параметров, редиректы
 * и SEO-метаданные.
 *
 * Запись сама не открывается: пока её не выбрали, панель пуста. Сам меняет
 * `detail` в адресе только в одном случае: после смены фильтров или поиска
 * карточка записи, выпавшей из выдачи, закрывается.
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

  watch(detailUrl, fetchDetail, { immediate: true });

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

  // С якорем: делятся ссылкой на конкретный раздел записи.
  const detailUrlForCopy = computed(() =>
    detailUrl.value
      ? `${getOrigin()}${options.sectionPath}/${detailUrl.value}${route.hash}`
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

  onMounted(async () => {
    await router.isReady();
    isRouterReady.value = true;

    if (!isSplitActive.value && detailUrl.value) {
      // Якорь сохраняется: deep-link на комментарий должен пережить редирект.
      router.replace({ path: detailPagePath.value, hash: route.hash });
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
   * Запись, которую фильтр убрал из списка, закрывается: иначе справа
   * оставалась бы, например, запись снятого источника, и казалось бы, что
   * фильтр не сработал. При первой загрузке проверки нет —
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

    // Флаг снимается до смены `detail`, и на этом цикл обрывается: закрытая
    // карточка сбрасывает `detailParentUrl`, вотчер снова зовёт проверку —
    // но она выходит на первом же условии.
    isListCheckPending = false;

    router.replace({
      query: {
        ...route.query,
        detail: undefined,
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
    router.push({
      query: {
        ...route.query,
        detail: undefined,
      },
    });
  }

  // Порядок записей пишет сам список (`GroupedList` или страница через
  // `useSectionNeighbours`) — тот же, по которому листают на телефоне.
  const sectionPaths = useSectionPaths(options.sectionPath);

  const detailNeighbours = computed<DetailPaneNeighbours | undefined>(() => {
    if (!detailUrl.value) {
      return undefined;
    }

    const paths = sectionPaths.value;
    const pathPrefix = `${options.sectionPath}/`;

    // Подзапись (подкласс) стоит в списке своим родителем.
    let index = paths.indexOf(`${pathPrefix}${detailUrl.value}`);

    if (index < 0 && detailParentUrl.value) {
      index = paths.indexOf(`${pathPrefix}${detailParentUrl.value}`);
    }

    if (index < 0 || paths.length < 2) {
      return undefined;
    }

    const previousPath = paths[index - 1];
    const nextPath = paths[index + 1];

    return {
      previousUrl: previousPath?.slice(pathPrefix.length),
      nextUrl: nextPath?.slice(pathPrefix.length),
      position: index + 1,
      total: paths.length,
    };
  });

  /**
   * Открывает запись в панели — так же, как клик по ней в списке.
   *
   * @param url Адрес записи.
   */
  function openDetail(url: string): void {
    router.push({
      query: {
        ...route.query,
        detail: url,
      },
    });
  }

  const isGalleryOpened = useState(GALLERY_OPENED_STATE_KEY, () => false);

  // Стрелки влево и вправо листают записи, пока панель открыта в широком
  // режиме и галерея картинок не перехватила их себе.
  onKeyStroke(['ArrowLeft', 'ArrowRight'], (event) => {
    const neighbours = detailNeighbours.value;

    if (
      !isSplitActive.value
      || !neighbours
      || isGalleryOpened.value
      || !isFreeArrowKey(event)
    ) {
      return;
    }

    const url =
      event.key === 'ArrowLeft' ? neighbours.previousUrl : neighbours.nextUrl;

    if (!url) {
      return;
    }

    event.preventDefault();
    openDetail(url);
  });

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
    detailUrlForCopy,
    detailEditUrl,
    handleCloseDetail,
    detailNeighbours,
    openDetail,
  };
}
