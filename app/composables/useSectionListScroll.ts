interface SectionListScrollState {
  itemViewportTop: number | null;
  itemKey: string | null;
  page: number | null;
  resetKey: string | null;
  scrollTop: number;
}

type ItemElementResolver = (itemKey: string) => HTMLElement | null;
type ItemScrollTopResolver = (itemKey: string) => number | undefined;

const SECTION_LIST_SCROLL_STATE_KEY = 'section-list-scroll';
const SECTION_LIST_ITEM_ID_PREFIX = 'section-list-item';

/**
 * Возвращает текущую вертикальную позицию окна.
 */
function getCurrentWindowScrollTop(): number {
  return (
    window.scrollY
    || document.documentElement.scrollTop
    || document.body.scrollTop
    || 0
  );
}

/**
 * Нормализует ключ сброса списка для сравнения сохраненного состояния.
 */
function getNormalizedResetKey(
  resetKey: MaybeRefOrGetter<string | undefined>,
): string | null {
  return toValue(resetKey) ?? null;
}

/**
 * Возвращает стабильный id элемента списка.
 */
export function getSectionListItemId(
  sectionKey: string,
  itemKey: string,
): string {
  return [
    SECTION_LIST_ITEM_ID_PREFIX,
    encodeURIComponent(sectionKey),
    encodeURIComponent(itemKey),
  ].join(':');
}

/**
 * Сохраняет и восстанавливает позицию скролла для списков разделов.
 */
export function useSectionListScroll(
  sectionKey: MaybeRefOrGetter<string | undefined>,
  resetKey: MaybeRefOrGetter<string | undefined> = undefined,
) {
  const stateBySection = useState<Record<string, SectionListScrollState>>(
    SECTION_LIST_SCROLL_STATE_KEY,
    () => ({}),
  );

  const resolvedSectionKey = computed(() => toValue(sectionKey));
  const resolvedResetKey = computed(() => getNormalizedResetKey(resetKey));

  const savedState = computed(() => {
    const key = resolvedSectionKey.value;

    if (!key) {
      return undefined;
    }

    return stateBySection.value[key];
  });

  const matchingSavedState = computed(() => {
    const state = savedState.value;

    if (!state || state.resetKey !== resolvedResetKey.value) {
      return undefined;
    }

    return state;
  });

  const savedItemKey = computed(() => matchingSavedState.value?.itemKey);

  const savedPage = computed(() => matchingSavedState.value?.page);

  const hasSavedPosition = computed(
    () => matchingSavedState.value !== undefined,
  );

  /**
   * Запоминает текущую позицию окна и последний активный элемент списка.
   */
  function rememberCurrentPosition(
    itemKey?: string,
    itemViewportTop?: number,
  ): void {
    const key = resolvedSectionKey.value;

    if (!import.meta.client || !key) {
      return;
    }

    const currentState = stateBySection.value[key];

    stateBySection.value = {
      ...stateBySection.value,
      [key]: {
        itemViewportTop:
          itemViewportTop ?? currentState?.itemViewportTop ?? null,
        itemKey: itemKey ?? currentState?.itemKey ?? null,
        page: currentState?.page ?? null,
        resetKey: resolvedResetKey.value,
        scrollTop: getCurrentWindowScrollTop(),
      },
    };
  }

  /**
   * Запоминает последнюю загруженную страницу, на которой находится активный элемент списка.
   */
  function rememberCurrentPage(page: number): void {
    const key = resolvedSectionKey.value;

    if (!import.meta.client || !key) {
      return;
    }

    const currentState = stateBySection.value[key];

    if (!currentState) {
      return;
    }

    stateBySection.value = {
      ...stateBySection.value,
      [key]: {
        ...currentState,
        page,
      },
    };
  }

  /**
   * Восстанавливает сохраненную позицию по элементу, расчетной координате
   * или последней известной позиции окна.
   */
  function restoreSavedPosition(
    resolveItemElement?: ItemElementResolver,
    resolveItemScrollTop?: ItemScrollTopResolver,
  ): boolean {
    if (!import.meta.client) {
      return false;
    }

    const state = matchingSavedState.value;

    if (!state) {
      return false;
    }

    const itemElement = state.itemKey
      ? resolveItemElement?.(state.itemKey)
      : null;

    if (itemElement) {
      const viewportTop = state.itemViewportTop;

      if (viewportTop !== null) {
        const { top } = itemElement.getBoundingClientRect();

        window.scrollBy({
          behavior: 'instant',
          top: top - viewportTop,
        });

        return true;
      }

      itemElement.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
      });

      return true;
    }

    const itemScrollTop = state.itemKey
      ? resolveItemScrollTop?.(state.itemKey)
      : undefined;

    if (state.itemKey && itemScrollTop === undefined) {
      return false;
    }

    window.scrollTo({
      behavior: 'instant',
      top:
        itemScrollTop !== undefined && state.itemViewportTop !== null
          ? itemScrollTop - state.itemViewportTop
          : (itemScrollTop ?? state.scrollTop),
    });

    return true;
  }

  return {
    hasSavedPosition,
    rememberCurrentPage,
    rememberCurrentPosition,
    restoreSavedPosition,
    savedItemKey,
    savedPage,
  };
}
