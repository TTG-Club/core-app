<script setup lang="ts">
  import type { SplitterItem } from '@nuxt/ui';

  import { clamp } from 'es-toolkit';

  import {
    SECTION_CENTERED_LIST_SIZE,
    SECTION_CENTERED_SPLIT_SUFFIX,
    SECTION_FILTERS_SIZE,
    SECTION_FILTERS_SPLIT_ID,
    SECTION_LIST_SIZE,
    SECTION_SPLIT_HANDLE_CLASS,
    SECTION_SPLIT_HANDLE_SUBTLE_CLASS,
    SECTION_SPLIT_ID,
    SPLIT_SIZE_EPSILON,
  } from '~/shared/consts';
  import {
    SectionContent,
    SectionSidebar,
    SectionToolbar,
  } from '~/shared/ui/section';
  import { AppFooter } from '~infrastructure/footer';

  const {
    collapsibleControls = false,
    listDefaultSize = SECTION_LIST_SIZE.default,
    listMinSize = SECTION_LIST_SIZE.min,
    listMaxSize = SECTION_LIST_SIZE.max,
    splitId = SECTION_SPLIT_ID,
  } = defineProps<{
    title: string;
    /**
     * Колонку с поиском и фильтрами можно свернуть в строку над списком
     * (широкий режим, настройка в шестерёнке). Только для разделов с
     * `FilterControls`: он сам перестраивается под свёрнутую колонку.
     */
    collapsibleControls?: boolean;
    /** Ширина списка по умолчанию, в процентах (широкий режим) */
    listDefaultSize?: number;
    /** Наименьшая ширина списка, в процентах */
    listMinSize?: number;
    /** Наибольшая ширина списка, в процентах */
    listMaxSize?: number;
    /**
     * Раскладка, под которой запоминается ширина списка. Своя у разделов с
     * другими ширинами, чтобы не сбивать их остальным.
     */
    splitId?: string;
  }>();

  const route = useRoute();
  const alert = computed(() => route.meta.alert);

  const { isSplitActive } = useLayoutWidth();
  const { isCollapsedInSplit } = useSectionFiltersCollapsed();
  const { isCenteredInSplit, isDetailExpanded } = useSectionCentered();

  // Узкая раскладка запоминает ширину списка отдельно: у неё своя колонка
  const activeSplitId = computed(() =>
    isCenteredInSplit.value
      ? `${splitId}-${SECTION_CENTERED_SPLIT_SUFFIX}`
      : splitId,
  );

  const { size: storedListSize, saveSize: saveListSize } = useSectionSplitSize(
    () => activeSplitId.value,
  );

  const isDetailOpen = computed(() => {
    const { detail } = route.query;

    return typeof detail === 'string' && detail !== '';
  });

  /**
   * Какие панели видны. В узкой раскладке без открытой записи список
   * занимает всю колонку, развёрнутая запись — тоже; в остальных случаях
   * список и запись стоят рядом.
   */
  const visiblePanels = computed<'both' | 'list' | 'detail'>(() => {
    if (!isCenteredInSplit.value) {
      return 'both';
    }

    if (!isDetailOpen.value) {
      return 'list';
    }

    return isDetailExpanded.value ? 'detail' : 'both';
  });

  // Обычному списку в узкой колонке — пропорции старого сайта 5e14; узкий
  // список классов и видов оставляет свои
  const listBounds = computed(() =>
    isCenteredInSplit.value && splitId === SECTION_SPLIT_ID
      ? SECTION_CENTERED_LIST_SIZE
      : { default: listDefaultSize, min: listMinSize, max: listMaxSize },
  );

  const { size: storedFiltersSize, saveSize: saveFiltersSize } =
    useSectionSplitSize(SECTION_FILTERS_SPLIT_ID);

  const isControlsCollapsed = computed(
    () => collapsibleControls && isCollapsedInSplit.value,
  );

  // Запомненная ширина могла остаться от других границ — держим её в них
  const listSize = computed(() =>
    clamp(
      storedListSize.value ?? listBounds.value.default,
      listBounds.value.min,
      listBounds.value.max,
    ),
  );

  const { filtersSide, detailSide } = useSectionColumnSides();

  // Запись может стоять и слева от списка: порядок панелей меняется местами
  const splitItems = computed<Array<SplitterItem>>(() => {
    const listClass = 'h-full flex-col py-3';
    const detailClass = 'h-full flex-col';

    if (visiblePanels.value === 'list') {
      return [{ slot: 'list', defaultSize: 100, class: listClass }];
    }

    if (visiblePanels.value === 'detail') {
      return [{ slot: 'detail', defaultSize: 100, class: detailClass }];
    }

    const list: SplitterItem = {
      slot: 'list',
      defaultSize: listSize.value,
      minSize: listBounds.value.min,
      maxSize: listBounds.value.max,
      class: listClass,
    };

    const detail: SplitterItem = {
      slot: 'detail',
      defaultSize: 100 - listSize.value,
      class: detailClass,
    };

    return detailSide.value === 'left' ? [detail, list] : [list, detail];
  });

  // В узкой раскладке запись — карточкой с отступом от разделителя
  const centeredDetailClass = computed(() =>
    detailSide.value === 'left' ? 'py-3 pr-3' : 'py-3 pl-3',
  );

  const listIndex = computed(() => (detailSide.value === 'left' ? 1 : 0));

  // Колонка фильтров одна на все разделы
  const filtersSize = computed(() =>
    clamp(
      storedFiltersSize.value ?? SECTION_FILTERS_SIZE.default,
      SECTION_FILTERS_SIZE.min,
      SECTION_FILTERS_SIZE.max,
    ),
  );

  const outerSplitItems = computed<Array<SplitterItem>>(() => {
    const main: SplitterItem = {
      slot: 'main',
      defaultSize: isControlsCollapsed.value ? 100 : 100 - filtersSize.value,
      class: 'h-full min-w-0',
    };

    if (isControlsCollapsed.value) {
      return [main];
    }

    const filters: SplitterItem = {
      slot: 'filters',
      defaultSize: filtersSize.value,
      minSize: SECTION_FILTERS_SIZE.min,
      maxSize: SECTION_FILTERS_SIZE.max,
      class: 'h-full',
    };

    return filtersSide.value === 'right' ? [main, filters] : [filters, main];
  });

  // Ключи разделителей — набор и порядок панелей: при перестановке разделитель
  // собирается заново с нужными ширинами
  const outerSplitKey = computed(() =>
    isControlsCollapsed.value ? 'collapsed' : filtersSide.value,
  );

  const innerSplitKey = computed(
    () => `${activeSplitId.value}-${detailSide.value}-${visiblePanels.value}`,
  );

  // В узкой раскладке у записи своя рамка — линия видна только при наведении
  const innerSplitHandleClass = computed(() =>
    isCenteredInSplit.value
      ? SECTION_SPLIT_HANDLE_SUBTLE_CLASS
      : SECTION_SPLIT_HANDLE_CLASS,
  );

  const filtersIndex = computed(() => (filtersSide.value === 'right' ? 1 : 0));

  /**
   * Сдвинул ли пользователь разделитель. Разделитель сообщает ширины и при
   * сборке — такие не пишем: обе ширины живут в одной куке, и одновременная
   * запись затёрла бы одну из них.
   *
   * @param size Новая ширина, в процентах.
   * @param current Действующая ширина.
   * @returns `true`, если ширина и правда другая.
   */
  function isSizeChanged(
    size: number | undefined,
    current: number,
  ): size is number {
    return size !== undefined && Math.abs(size - current) >= SPLIT_SIZE_EPSILON;
  }

  /**
   * Запоминает ширину колонки фильтров после перетаскивания разделителя.
   *
   * @param sizes Ширины колонок, в процентах.
   */
  function handleOuterSplitLayout(sizes: Array<number>): void {
    const size = sizes[filtersIndex.value];

    if (!isControlsCollapsed.value && isSizeChanged(size, filtersSize.value)) {
      saveFiltersSize(size);
    }
  }

  /**
   * Запоминает ширину списка после перетаскивания разделителя.
   *
   * @param sizes Ширины колонок, в процентах.
   */
  function handleSplitLayout(sizes: Array<number>): void {
    const size = sizes[listIndex.value];

    if (visiblePanels.value === 'both' && isSizeChanged(size, listSize.value)) {
      saveListSize(size);
    }
  }
</script>

<template>
  <!-- Трехколоночный режим (Wide Mode). Высоту задают обёртки: разделитель -->
  <!-- ставит себе `height: 100%` в style, и класс высоты на нём не действует. -->
  <!-- Узкая раскладка — та же, но колонкой по центру, как старый 5e14. -->
  <div
    v-if="isSplitActive && $slots.detail"
    class="h-dvh w-full"
    :class="{ 'mx-auto max-w-330 px-2': isCenteredInSplit }"
  >
    <!-- Колонка фильтров — слева или справа; свёрнутые встают строкой над -->
    <!-- списком, и разделитель остаётся с одной панелью. Ключ — набор и -->
    <!-- порядок панелей: при перестановке разделитель собирается заново. -->
    <USplitter
      :id="`section-split-${SECTION_FILTERS_SPLIT_ID}`"
      :key="outerSplitKey"
      :items="outerSplitItems"
      :ui="{ handle: SECTION_SPLIT_HANDLE_CLASS }"
      @layout="handleOuterSplitLayout"
    >
      <template #filters>
        <SectionSidebar
          :title="title"
          fluid
        >
          <slot name="controls" />
        </SectionSidebar>
      </template>

      <!-- Список и запись. Ключ — раскладка, порядок и набор панелей: у узкого -->
      <!-- списка свои границы, и разделитель собирается заново с её шириной. -->
      <template #main>
        <USplitter
          :id="`section-split-${activeSplitId}`"
          :key="innerSplitKey"
          :items="splitItems"
          :ui="{ handle: innerSplitHandleClass }"
          @layout="handleSplitLayout"
        >
          <!-- Список -->
          <template #list>
            <!-- Свёрнутая колонка — строкой над списком, вне его прокрутки -->
            <SectionToolbar
              v-if="isControlsCollapsed"
              :title="title"
            >
              <slot name="controls" />
            </SectionToolbar>

            <div
              id="section-list-container"
              class="mr-1.5 flex h-full flex-auto flex-col gap-4 overflow-y-auto pr-3 pb-4 pl-4"
              :class="{ 'pt-3': isControlsCollapsed }"
            >
              <SectionContent :alert="alert">
                <slot name="default" />
              </SectionContent>
            </div>
          </template>

          <!-- Запись -->
          <template #detail>
            <div
              v-if="isCenteredInSplit"
              class="size-full"
              :class="centeredDetailClass"
            >
              <div
                class="flex size-full flex-col overflow-hidden rounded-xl border border-default bg-elevated/40"
              >
                <slot name="detail" />
              </div>
            </div>

            <slot
              v-else
              name="detail"
            />
          </template>
        </USplitter>
      </template>
    </USplitter>
  </div>

  <!-- Стандартный режим (Default Mode / Mobile) -->
  <div
    v-else
    class="flex min-h-dvh w-full flex-col"
  >
    <div
      class="mx-auto flex min-h-dvh w-full flex-col lg:max-w-330 lg:flex-row"
    >
      <SectionSidebar :title="title">
        <slot name="controls" />
      </SectionSidebar>

      <div class="flex min-h-dvh flex-auto flex-col gap-4 px-4 pb-8 lg:pt-4">
        <SectionContent :alert="alert">
          <slot name="default" />
        </SectionContent>
      </div>
    </div>

    <AppFooter />
  </div>
</template>
