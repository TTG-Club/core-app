<script setup lang="ts" generic="T extends { url: string }">
  import { get } from 'es-toolkit/compat';
  import { computed, ref, watch } from 'vue';

  import { PageGrid } from '~ui/page';

  import {
    GROUPED_LIST_COLUMN_BREAKPOINTS,
    GROUPED_LIST_DEFAULT_BOTTOM_OFFSET,
    GROUPED_LIST_DEFAULT_COLUMNS,
    GROUPED_LIST_DEFAULT_OVERSCAN,
    GROUPED_LIST_DEFAULT_ROW_HEIGHT,
    GROUPED_LIST_DEFAULT_SEPARATOR_HEIGHT,
    GROUPED_LIST_DEFAULT_SEPARATOR_TOP_OFFSET,
    GROUPED_LIST_DEFAULT_VIRTUAL_THRESHOLD,
    GROUPED_LIST_GRID_CLASSES,
  } from './constants';

  type SeparatorLabel = string | ((value: string | number) => string);
  type GroupKey = string | number;

  interface Group<TItem> {
    key: GroupKey;
    items: Array<TItem>;
  }

  interface SeparatorVirtualRow {
    type: 'separator';
    key: string;
    groupKey: GroupKey;
  }

  interface ItemsVirtualRow<TItem> {
    type: 'items';
    key: string;
    items: Array<TItem>;
  }

  type VirtualRow<TItem> = SeparatorVirtualRow | ItemsVirtualRow<TItem>;

  interface GroupSortAuto {
    mode: 'auto';
  }

  interface GroupSortOrdered {
    mode: 'ordered';
    order: Set<GroupKey>;
    unknown?: 'after' | 'before' | 'auto';
  }

  interface GroupSortComparator {
    mode: 'comparator';
    compare: (a: GroupKey, b: GroupKey) => number;
  }

  interface GroupSortCustom {
    mode: 'custom';
    compare: (items: Array<T>) => Array<Group<T>>;
  }

  type GroupSort =
    | GroupSortAuto
    | GroupSortOrdered
    | GroupSortComparator
    | GroupSortCustom;

  interface Props {
    items: Array<T>;
    field?: string;
    separatorLabel?: SeparatorLabel;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    groupSort?: GroupSort;
    virtual?: boolean;
    virtualThreshold?: number;
    rowHeight?: number;
    separatorHeight?: number;
    overscan?: number;
    virtualBottomOffset?: number;
    resetKey?: string;
    scrollKey?: string;
  }

  const {
    items,
    field = undefined,
    separatorLabel = undefined,
    columns = GROUPED_LIST_DEFAULT_COLUMNS,
    groupSort = { mode: 'auto' },
    virtual = false,
    virtualThreshold = GROUPED_LIST_DEFAULT_VIRTUAL_THRESHOLD,
    rowHeight = GROUPED_LIST_DEFAULT_ROW_HEIGHT,
    separatorHeight = GROUPED_LIST_DEFAULT_SEPARATOR_HEIGHT,
    overscan = GROUPED_LIST_DEFAULT_OVERSCAN,
    virtualBottomOffset = GROUPED_LIST_DEFAULT_BOTTOM_OFFSET,
    resetKey = undefined,
    scrollKey = undefined,
  } = defineProps<Props>();

  const route = useRoute();

  const resolvedScrollKey = computed(() => {
    if (scrollKey) {
      return scrollKey;
    }

    return typeof route.name === 'string' ? route.name : undefined;
  });

  const {
    hasSavedPosition,
    rememberCurrentPosition,
    restoreSavedPosition,
    savedItemKey,
  } = useSectionListScroll(resolvedScrollKey, () => resetKey);

  const isScrollPositionRestored = ref(false);

  /**
   * Разбивает элементы на строки виртуальной сетки.
   */
  function chunkItems<TItem>(
    sourceItems: Array<TItem>,
    columnsCount: number,
  ): Array<Array<TItem>> {
    const chunks: Array<Array<TItem>> = [];

    for (
      let itemIndex = 0;
      itemIndex < sourceItems.length;
      itemIndex += columnsCount
    ) {
      chunks.push(sourceItems.slice(itemIndex, itemIndex + columnsCount));
    }

    return chunks;
  }

  /**
   * Возвращает количество колонок для текущей ширины контейнера.
   */
  function getColumnCount(containerWidth: number, maxColumns: number): number {
    return GROUPED_LIST_COLUMN_BREAKPOINTS.reduce((columnCount, breakpoint) => {
      if (containerWidth >= breakpoint.width) {
        return Math.min(breakpoint.columns, maxColumns);
      }

      return columnCount;
    }, 1);
  }

  function upperFirst(text: string): string {
    const str = text.trim();

    if (!str.length) {
      return '';
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getComparableKey(rawKey: string): GroupKey {
    if (!rawKey.length) {
      return rawKey;
    }

    const numericKey = Number(rawKey);

    return Number.isNaN(numericKey) ? rawKey : numericKey;
  }

  function sortKeysAuto(keys: Array<GroupKey>): Array<GroupKey> {
    return [...keys].sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }

      return sortString(String(a), String(b));
    });
  }

  function sortKeysOrdered(
    keys: Array<GroupKey>,
    sortConfig: GroupSortOrdered,
  ): Array<GroupKey> {
    const orderIndexByKeyText = new Map<string, number>();

    Array.from(sortConfig.order).forEach((key, index) => {
      orderIndexByKeyText.set(String(key), index);
    });

    const knownKeys: Array<GroupKey> = [];
    const unknownKeys: Array<GroupKey> = [];

    keys.forEach((key) => {
      if (orderIndexByKeyText.has(String(key))) {
        knownKeys.push(key);
      } else {
        unknownKeys.push(key);
      }
    });

    const sortedKnown = [...knownKeys].sort((a, b) => {
      const aIndex = orderIndexByKeyText.get(String(a));
      const bIndex = orderIndexByKeyText.get(String(b));

      if (aIndex === undefined && bIndex === undefined) {
        return 0;
      }

      if (aIndex === undefined) {
        return 1;
      }

      if (bIndex === undefined) {
        return -1;
      }

      return aIndex - bIndex;
    });

    const unknownPolicy = sortConfig.unknown ?? 'after';

    if (unknownPolicy === 'before') {
      return [...sortKeysAuto(unknownKeys), ...sortedKnown];
    }

    return [...sortedKnown, ...sortKeysAuto(unknownKeys)];
  }

  function sortGroupKeys(keys: Array<GroupKey>): Array<GroupKey> {
    if (groupSort.mode === 'comparator') {
      return [...keys].sort(groupSort.compare);
    }

    if (groupSort.mode === 'ordered') {
      return sortKeysOrdered(keys, groupSort);
    }

    return sortKeysAuto(keys);
  }

  const groupedItems = computed<Array<Group<T>>>(() => {
    if (!items.length) {
      return [];
    }

    if (groupSort.mode === 'custom') {
      return groupSort.compare(items);
    }

    if (!field) {
      return [];
    }

    const grouped = items.reduce<Record<string, Array<T>>>((acc, item) => {
      const keyText = String(get(item, field) ?? '');

      (acc[keyText] ??= []).push(item);

      return acc;
    }, {});

    const keys = Object.keys(grouped).map(getComparableKey);
    const sortedKeys = sortGroupKeys(keys);

    return sortedKeys.map((key) => ({
      key,
      items: grouped[String(key)] ?? [],
    }));
  });

  function getSeparatorText(value: GroupKey): string {
    const valueText = String(value);

    if (!separatorLabel) {
      return upperFirst(valueText);
    }

    if (typeof separatorLabel === 'function') {
      return upperFirst(separatorLabel(value));
    }

    return upperFirst(separatorLabel.replace('{value}', valueText));
  }

  const shouldUseVirtual = computed(
    () => virtual && items.length >= virtualThreshold,
  );

  const virtualSource = computed<Array<Group<T>>>(() => {
    if (field) {
      return groupedItems.value;
    }

    return [
      {
        key: 'default',
        items,
      },
    ];
  });

  // До первого измерения ширины контейнера количество колонок неизвестно.
  // Скрываем виртуальный список, чтобы избежать мерцания с 1 колонкой.
  const isColumnCountReady = ref(false);
  const virtualColumns = ref(1);

  const activeVirtualColumns = computed(() =>
    Math.min(virtualColumns.value, columns),
  );

  function getItemKey(item: T): string {
    return item.url;
  }

  function getItemElementId(item: T): string | undefined {
    if (!resolvedScrollKey.value) {
      return undefined;
    }

    return getSectionListItemId(resolvedScrollKey.value, getItemKey(item));
  }

  function getSavedItemElement(itemKey: string): HTMLElement | null {
    if (!resolvedScrollKey.value) {
      return null;
    }

    return document.getElementById(
      getSectionListItemId(resolvedScrollKey.value, itemKey),
    );
  }

  function rememberListItem(item: T): void {
    const itemElement = getSavedItemElement(getItemKey(item));
    const itemViewportTop = itemElement?.getBoundingClientRect().top;

    rememberCurrentPosition(getItemKey(item), itemViewportTop);
  }

  const isSavedItemLoaded = computed(() => {
    const itemKey = savedItemKey.value;

    if (!itemKey) {
      return true;
    }

    return items.some((item) => getItemKey(item) === itemKey);
  });

  const isScrollRestorePending = computed(() => {
    return (
      hasSavedPosition.value
      && isSavedItemLoaded.value
      && !isScrollPositionRestored.value
    );
  });

  const scrollRestoreClasses = computed(() => {
    return {
      invisible: isScrollRestorePending.value,
    };
  });

  const virtualGridClasses = computed(() => {
    return GROUPED_LIST_GRID_CLASSES.slice(0, activeVirtualColumns.value);
  });

  const virtualRows = computed<Array<VirtualRow<T>>>(() => {
    return virtualSource.value.flatMap((group) => {
      const rows = chunkItems(group.items, activeVirtualColumns.value).map(
        (rowItems, rowIndex): ItemsVirtualRow<T> => ({
          type: 'items',
          key: `items:${String(group.key)}:${rowIndex}`,
          items: rowItems,
        }),
      );

      if (!field) {
        return rows;
      }

      return [
        {
          type: 'separator',
          key: `separator:${String(group.key)}`,
          groupKey: group.key,
        },
        ...rows,
      ];
    });
  });

  const virtualContainerElement = ref<HTMLElement | null>(null);

  const { width: virtualContainerWidth } = useElementSize(
    virtualContainerElement,
  );

  const { top: virtualContainerTop } = useElementBounding(
    virtualContainerElement,
  );

  const { height: windowHeight } = useWindowSize({ initialHeight: 0 });
  const { y: windowScrollTop } = useWindowScroll();

  const virtualRowHeights = computed(() => {
    return virtualRows.value.map((virtualRow, rowIndex) => {
      if (virtualRow.type !== 'separator') {
        return rowHeight;
      }

      // Для не-первых разделителей добавляем отступ сверху к высоте строки,
      // чтобы следующие строки сдвинулись вниз и не перекрывались.
      const topOffset =
        rowIndex > 0 ? GROUPED_LIST_DEFAULT_SEPARATOR_TOP_OFFSET : 0;

      return separatorHeight + topOffset;
    });
  });

  const virtualRowOffsets = computed(() => {
    let currentOffset = 0;

    return virtualRowHeights.value.map((height) => {
      const offset = currentOffset;

      currentOffset += height;

      return offset;
    });
  });

  const virtualTotalHeight = computed(() => {
    return virtualRowHeights.value.reduce(
      (totalHeight, height) => totalHeight + height,
      0,
    );
  });

  const visibleVirtualRows = computed(() => {
    const viewportStart = Math.max(0, -virtualContainerTop.value);

    const viewportEnd =
      viewportStart + windowHeight.value + virtualBottomOffset;

    const startIndex = virtualRowOffsets.value.findIndex((offset, rowIndex) => {
      const height = virtualRowHeights.value[rowIndex] ?? rowHeight;

      return offset + height >= viewportStart;
    });

    if (startIndex === -1) {
      return [];
    }

    const safeStartIndex = Math.max(0, startIndex - overscan);

    const endIndex = virtualRowOffsets.value.findIndex((offset) => {
      return offset > viewportEnd;
    });

    const safeEndIndex =
      endIndex === -1
        ? virtualRows.value.length
        : Math.min(virtualRows.value.length, endIndex + overscan);

    return virtualRows.value
      .slice(safeStartIndex, safeEndIndex)
      .map((virtualRow, visibleIndex) => {
        const rowIndex = safeStartIndex + visibleIndex;
        const baseTop = virtualRowOffsets.value[rowIndex] ?? 0;

        // Для не-первых разделителей сдвигаем блок вниз внутри расширенной строки,
        // чтобы отступ был сверху, а не снизу.
        const separatorTopShift =
          virtualRow.type === 'separator' && rowIndex > 0
            ? GROUPED_LIST_DEFAULT_SEPARATOR_TOP_OFFSET
            : 0;

        return {
          row: virtualRow,
          top: baseTop + separatorTopShift,
        };
      });
  });

  function getVirtualItemScrollTop(itemKey: string): number | undefined {
    if (!virtualContainerElement.value) {
      return undefined;
    }

    const rowIndex = virtualRows.value.findIndex((virtualRow) => {
      return (
        virtualRow.type === 'items'
        && virtualRow.items.some((item) => getItemKey(item) === itemKey)
      );
    });

    if (rowIndex < 0) {
      return undefined;
    }

    const containerDocumentTop =
      windowScrollTop.value
      + virtualContainerElement.value.getBoundingClientRect().top;

    return Math.max(
      0,
      containerDocumentTop + (virtualRowOffsets.value[rowIndex] ?? 0),
    );
  }

  async function restoreListScrollPosition(): Promise<void> {
    if (isScrollPositionRestored.value) {
      return;
    }

    if (shouldUseVirtual.value && !isColumnCountReady.value) {
      return;
    }

    await nextTick();
    await new Promise(requestAnimationFrame);

    const isRestored = restoreSavedPosition(
      getSavedItemElement,
      shouldUseVirtual.value ? getVirtualItemScrollTop : undefined,
    );

    if (isRestored) {
      isScrollPositionRestored.value = true;
    }
  }

  watch(
    [virtualContainerWidth, () => columns],
    ([containerWidth]) => {
      virtualColumns.value = getColumnCount(containerWidth, columns);

      if (containerWidth > 0) {
        isColumnCountReady.value = true;
      }
    },
    { immediate: true },
  );

  // Скролл к началу списка только при смене фильтра/поиска (resetKey).
  // Изменение колонок при ресайзе не должно вызывать прокрутку.
  watch(
    () => resetKey,
    () => {
      isScrollPositionRestored.value = false;

      if (!virtualContainerElement.value) {
        return;
      }

      const documentTop =
        windowScrollTop.value
        + virtualContainerElement.value.getBoundingClientRect().top;

      window.scrollTo({
        top: Math.max(0, documentTop),
      });
    },
  );

  watch(
    [() => items, shouldUseVirtual, isColumnCountReady, visibleVirtualRows],
    () => {
      restoreListScrollPosition();
    },
    {
      flush: 'post',
      immediate: true,
    },
  );

  onBeforeRouteLeave(() => {
    rememberCurrentPosition();
  });
</script>

<template>
  <div :class="scrollRestoreClasses">
    <div
      v-if="shouldUseVirtual"
      ref="virtualContainerElement"
      class="relative"
      :style="{ height: `${virtualTotalHeight}px` }"
    >
      <template v-if="isColumnCountReady">
        <template
          v-for="virtualItem in visibleVirtualRows"
          :key="virtualItem.row.key"
        >
          <div
            class="absolute inset-x-0"
            :style="{ transform: `translateY(${virtualItem.top}px)` }"
          >
            <div
              v-if="virtualItem.row.type === 'separator'"
              class="flex items-center pb-2.5"
              :style="{ height: `${separatorHeight}px` }"
            >
              <USeparator>
                {{ getSeparatorText(virtualItem.row.groupKey) }}
              </USeparator>
            </div>

            <div
              v-else
              class="@container py-1.5"
              :style="{ height: `${rowHeight}px` }"
            >
              <div :class="['grid gap-3', virtualGridClasses]">
                <div
                  v-for="item in virtualItem.row.items"
                  :id="getItemElementId(item)"
                  :key="item.url"
                  @click.left.exact.capture="rememberListItem(item)"
                >
                  <slot :item="item" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <PageGrid
      v-else-if="!field"
      :columns="columns"
    >
      <div
        v-for="item in items"
        :id="getItemElementId(item)"
        :key="item.url"
        @click.left.exact.capture="rememberListItem(item)"
      >
        <slot :item="item" />
      </div>
    </PageGrid>

    <div
      v-else
      class="flex flex-col gap-6"
    >
      <div
        v-for="group in groupedItems"
        :key="group.key"
        class="flex flex-col gap-4"
      >
        <USeparator>
          {{ getSeparatorText(group.key) }}
        </USeparator>

        <PageGrid :columns="columns">
          <div
            v-for="item in group.items"
            :id="getItemElementId(item)"
            :key="item.url"
            @click.left.exact.capture="rememberListItem(item)"
          >
            <slot :item="item" />
          </div>
        </PageGrid>
      </div>
    </div>
  </div>
</template>
