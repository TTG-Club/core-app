<script setup lang="ts" generic="T extends { url: string }">
  import type { Group, GroupKey, GroupSort, SeparatorLabel } from './types';
  import type { ItemsRow, ListRow } from './utils';

  import { get, upperFirst } from 'es-toolkit/compat';
  import { computed, ref, watch } from 'vue';

  import { PageGrid } from '~ui/page';

  import {
    GROUPED_LIST_ANCHOR_SETTLE_FRAMES,
    GROUPED_LIST_DEFAULT_BOTTOM_OFFSET,
    GROUPED_LIST_DEFAULT_COLUMNS,
    GROUPED_LIST_DEFAULT_OVERSCAN,
    GROUPED_LIST_DEFAULT_ROW_HEIGHT,
    GROUPED_LIST_DEFAULT_SEPARATOR_HEIGHT,
    GROUPED_LIST_DEFAULT_SEPARATOR_TOP_OFFSET,
    GROUPED_LIST_DEFAULT_VIRTUAL_THRESHOLD,
    GROUPED_LIST_GRID_CLASSES,
  } from './constants';
  import {
    chunkItems,
    flattenGroupTree,
    getColumnCount,
    getComparableKey,
    sortKeysAuto,
    sortKeysOrdered,
  } from './utils';

  interface Props {
    items: Array<T>;
    field?: string;
    separatorLabel?: SeparatorLabel;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    groupSort?: GroupSort<T>;
    virtual?: boolean;
    virtualThreshold?: number;
    rowHeight?: number;
    separatorHeight?: number;
    overscan?: number;
    virtualBottomOffset?: number;
    resetKey?: string;
    scrollKey?: string;
    activeItemKey?: string;
    itemSort?: (firstItem: T, secondItem: T) => number;
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
    activeItemKey = undefined,
    itemSort = undefined,
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

  const { isSplitActive } = useLayoutWidth();

  function sortGroupKeys(keys: Array<GroupKey>): Array<GroupKey> {
    if (groupSort.mode === 'comparator') {
      return [...keys].sort(groupSort.compare);
    }

    if (groupSort.mode === 'ordered') {
      return sortKeysOrdered(keys, groupSort);
    }

    return sortKeysAuto(keys);
  }

  const sortedItems = computed<Array<T>>(() => {
    return itemSort ? [...items].sort(itemSort) : items;
  });

  const groupedItems = computed<Array<Group<T>>>(() => {
    if (!items.length) {
      return [];
    }

    if (groupSort.mode === 'custom') {
      return groupSort.compare(sortedItems.value);
    }

    if (!field) {
      return [];
    }

    const grouped = sortedItems.value.reduce<Record<string, Array<T>>>(
      (acc, item) => {
        const keyText = String(get(item, field) ?? '');

        (acc[keyText] ??= []).push(item);

        return acc;
      },
      {},
    );

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
      return upperFirst(valueText.trim());
    }

    const labelText =
      typeof separatorLabel === 'function'
        ? separatorLabel(value)
        : separatorLabel.replace('{value}', valueText);

    return upperFirst(labelText.trim());
  }

  const isTreeMode = computed(() => groupSort.mode === 'tree');

  const treeRows = computed<Array<ListRow<T>>>(() => {
    if (groupSort.mode !== 'tree') {
      return [];
    }

    return flattenGroupTree(groupSort.build(sortedItems.value));
  });

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
        items: sortedItems.value,
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

    isScrollPositionRestored.value = true;
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

  const virtualRows = computed<Array<ListRow<T>>>(() => {
    if (isTreeMode.value) {
      return treeRows.value.flatMap((row): Array<ListRow<T>> => {
        if (row.type === 'separator') {
          return [row];
        }

        return chunkItems(row.items, activeVirtualColumns.value).map(
          (rowItems, rowIndex): ItemsRow<T> => ({
            type: 'items',
            key: `${row.key}:${rowIndex}`,
            items: rowItems,
          }),
        );
      });
    }

    return virtualSource.value.flatMap((group) => {
      const rows = chunkItems(group.items, activeVirtualColumns.value).map(
        (rowItems, rowIndex): ItemsRow<T> => ({
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
          label: getSeparatorText(group.key),
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

  /**
   * Верх виртуального контейнера в координатах документа. `undefined`, пока
   * контейнер не смонтирован.
   */
  function getContainerDocumentTop(): number | undefined {
    if (!virtualContainerElement.value) {
      return undefined;
    }

    return (
      windowScrollTop.value
      + virtualContainerElement.value.getBoundingClientRect().top
    );
  }

  /**
   * Индекс виртуальной строки, содержащей элемент с данным ключом. `-1`, если
   * элемент не найден.
   */
  function findVirtualRowIndexByItemKey(itemKey: string): number {
    return virtualRows.value.findIndex((virtualRow) => {
      return (
        virtualRow.type === 'items'
        && virtualRow.items.some((item) => getItemKey(item) === itemKey)
      );
    });
  }

  function getVirtualItemScrollTop(itemKey: string): number | undefined {
    const containerDocumentTop = getContainerDocumentTop();

    if (containerDocumentTop === undefined) {
      return undefined;
    }

    const rowIndex = findVirtualRowIndexByItemKey(itemKey);

    if (rowIndex < 0) {
      return undefined;
    }

    return Math.max(
      0,
      containerDocumentTop + (virtualRowOffsets.value[rowIndex] ?? 0),
    );
  }

  const scrollContainer = shallowRef<HTMLElement | Window | null>(
    import.meta.client ? window : null,
  );

  /**
   * Поиск DOM-контейнера для скролла в Wide Mode.
   * Использует requestAnimationFrame для повторной попытки,
   * т.к. элемент может ещё не быть в DOM при первом вызове.
   */
  function resolveSplitContainer(): void {
    const container = document.getElementById('section-list-container');

    if (container) {
      scrollContainer.value = container;

      return;
    }

    requestAnimationFrame(() => {
      scrollContainer.value =
        document.getElementById('section-list-container') ?? window;
    });
  }

  if (import.meta.client) {
    onMounted(() => {
      watch(
        isSplitActive,
        (active) => {
          if (active) {
            resolveSplitContainer();
          } else {
            scrollContainer.value = window;
          }
        },
        { immediate: true },
      );
    });
  }

  /**
   * Выполняет прокрутку списка к указанному элементу.
   * Поддерживает как обычный, так и виртуальный список.
   * @param itemKey Уникальный идентификатор элемента (url).
   * @returns Возвращает true, если прокрутка была успешно выполнена.
   */
  function scrollToItem(itemKey: string): boolean {
    if (!import.meta.client) {
      return false;
    }

    if (!shouldUseVirtual.value) {
      const element = getSavedItemElement(itemKey);

      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'instant' });

        return true;
      }

      return false;
    }

    const containerDocumentTop = getContainerDocumentTop();

    if (containerDocumentTop === undefined) {
      return false;
    }

    const rowIndex = findVirtualRowIndexByItemKey(itemKey);

    if (rowIndex < 0) {
      return false;
    }

    const rowOffset = virtualRowOffsets.value[rowIndex] ?? 0;
    const container = scrollContainer.value;

    if (container === window) {
      window.scrollTo({
        top: Math.max(0, containerDocumentTop + rowOffset),
        behavior: 'instant',
      });

      return true;
    }

    if (container instanceof HTMLElement) {
      container.scrollTo({
        top: rowOffset,
        behavior: 'instant',
      });

      return true;
    }

    return false;
  }

  async function restoreListScrollPosition(): Promise<void> {
    if (import.meta.server) {
      return;
    }

    if (isScrollPositionRestored.value) {
      return;
    }

    if (shouldUseVirtual.value && !isColumnCountReady.value) {
      return;
    }

    await nextTick();
    await new Promise(requestAnimationFrame);

    let isRestored = restoreSavedPosition(
      getSavedItemElement,
      shouldUseVirtual.value ? getVirtualItemScrollTop : undefined,
    );

    if (!isRestored && activeItemKey) {
      const isFirstItem = items[0] && getItemKey(items[0]) === activeItemKey;

      if (!isFirstItem) {
        isRestored = scrollToItem(activeItemKey);
      } else {
        isRestored = true;
      }
    }

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

  /**
   * Карточка под верхом вьюпорта и отступ до верха её строки. Дельта обязательна:
   * без неё якорь превращается в «прижать строку к верху экрана», и обратное
   * переключение не вернуло бы на прежнее место.
   */
  const viewportAnchor = shallowRef<{
    itemKey: string;
    topDelta: number;
  } | null>(null);

  // Якорь снимается на скролле, а не в момент смены раскладки: `columns` —
  // проп, и к первому же watcher'у строки пересчитаны под новое число колонок.
  // Поэтому же следим за `windowScrollTop`, а не за смещениями строк: их
  // пересчёт означает, что раскладка уже новая, и якорь прежней был бы потерян.
  watch(
    windowScrollTop,
    () => {
      const containerTop = getContainerDocumentTop();

      if (containerTop === undefined) {
        return;
      }

      // Последняя строка, начинающаяся не ниже верха вьюпорта, — она его и
      // пересекает.
      const anchorRow = visibleVirtualRows.value.findLast(
        ({ row, top }) =>
          row.type === 'items' && containerTop + top <= windowScrollTop.value,
      );

      const anchorItem =
        anchorRow?.row.type === 'items' ? anchorRow.row.items[0] : undefined;

      if (!anchorRow || !anchorItem) {
        viewportAnchor.value = null;

        return;
      }

      viewportAnchor.value = {
        itemKey: getItemKey(anchorItem),
        topDelta: windowScrollTop.value - (containerTop + anchorRow.top),
      };
    },
    { flush: 'sync' },
  );

  // При смене числа колонок высота списка меняется кратно, а позиция скролла
  // остаётся прежней — пользователь оказывается в другой части каталога.
  // Возвращаем под вьюпорт ту же карточку.
  //
  // Колонки меняет и ширина контейнера, поэтому переключатель, ресайз окна,
  // поворот планшета и панель детали идут одним путём.
  watch(activeVirtualColumns, () => {
    const anchor = viewportAnchor.value;

    if (!anchor) {
      return;
    }

    // Смещения строк зависят от ширины контейнера, а она приходит от
    // ResizeObserver отдельным тиком: сразу после смены колонок расчёт ещё может
    // опираться на прежнюю раскладку. Доводим позицию, пока она меняется, но не
    // дольше нескольких кадров — раскладка успевает устояться за один-два.
    let framesLeft = GROUPED_LIST_ANCHOR_SETTLE_FRAMES;
    let previousScrollTop = -1;

    const applyAnchor = () => {
      // Позицию берём расчётом, а не из DOM: после смены раскладки карточка
      // может быть не отрисована.
      const itemScrollTop = getVirtualItemScrollTop(anchor.itemKey);

      if (itemScrollTop === undefined) {
        return;
      }

      const scrollTop = Math.max(0, itemScrollTop + anchor.topDelta);

      if (scrollTop === previousScrollTop) {
        return;
      }

      previousScrollTop = scrollTop;
      window.scrollTo({ behavior: 'instant', top: scrollTop });

      framesLeft -= 1;

      if (framesLeft > 0) {
        requestAnimationFrame(applyAnchor);
      }
    };

    requestAnimationFrame(applyAnchor);
  });

  // Скролл к началу списка только при смене фильтра/поиска (resetKey).
  // Изменение колонок при ресайзе не должно вызывать прокрутку.
  watch(
    () => resetKey,
    () => {
      isScrollPositionRestored.value = false;

      const documentTop = getContainerDocumentTop();

      if (documentTop === undefined) {
        return;
      }

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
              <USeparator :label="virtualItem.row.label" />
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

    <div
      v-else-if="isTreeMode"
      class="flex flex-col gap-4"
    >
      <template
        v-for="treeRow in treeRows"
        :key="treeRow.key"
      >
        <USeparator
          v-if="treeRow.type === 'separator'"
          :label="treeRow.label"
        />

        <PageGrid
          v-else
          :columns="columns"
        >
          <div
            v-for="item in treeRow.items"
            :id="getItemElementId(item)"
            :key="item.url"
            @click.left.exact.capture="rememberListItem(item)"
          >
            <slot :item="item" />
          </div>
        </PageGrid>
      </template>
    </div>

    <PageGrid
      v-else-if="!field"
      :columns="columns"
    >
      <div
        v-for="item in sortedItems"
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
