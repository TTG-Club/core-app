<script setup lang="ts">
  import type { LocationQuery } from 'vue-router';

  import type { Filter, FilterGroups } from '~infrastructure/filter';

  import type {
    CharacterInventoryItem,
    ItemCatalogItem,
    ItemSummary,
  } from '../../model';

  import { omit } from 'es-toolkit';

  import {
    buildSearchQuery,
    FilterDrawer,
    getGroupItems,
    hasTouchedItem,
    normalizeDependentSelections,
    parseFilter,
  } from '~infrastructure/filter';
  import { ItemDrawer } from '~items/drawer';

  import { useCharacterSheet } from '../../composables';
  import {
    buildInventoryItem,
    getInventoryItemId,
    ITEMS_DETAIL_BASE_PATH,
    ITEMS_FILTERS_PATH,
    ITEMS_SEARCH_PATH,
    parseItemCatalog,
    parseItemDetail,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const toast = useToast();

  const overlay = useOverlay();

  const { character, addInventoryItems } = useCharacterSheet();

  // Дровер описания предмета; без destroyOnClose — повторный open()
  // после закрытия иначе падает («Overlay not found»).
  const itemPreviewDrawer = overlay.create(ItemDrawer, {
    props: {
      url: '',
      onClose: () => itemPreviewDrawer.close(),
    },
  });

  function handlePreview(itemUrl: string) {
    itemPreviewDrawer.open({ url: itemUrl });
  }

  // Полный набор групп фильтров раздела «Предметы» — лёгкий запрос вместо
  // жёстко зашитого списка категорий.
  const { data: filterDefaults } = await useAsyncData(
    'character-sheet:item-filters',
    async () => {
      const response = await $fetch<unknown>(ITEMS_FILTERS_PATH, {
        method: 'GET',
        retry: 0,
      });

      return parseFilter(response);
    },
    { server: false },
  );

  const filterState = ref<Filter | undefined>(undefined);

  // Рабочая копия фильтра инициализируется из загруженных дефолтов один раз;
  // дальнейшие правки иммутабельны, поэтому кешированный ответ не мутируется.
  watch(
    filterDefaults,
    (defaults) => {
      if (defaults && !filterState.value) {
        filterState.value = defaults;
      }
    },
    { immediate: true },
  );

  const filterGroups = computed<FilterGroups>(
    () => filterState.value?.filters ?? [],
  );

  // Источники в модалке не редактируются и в запрос не уходят: каталог ищет
  // по всем источникам. buildSearchQuery иначе добавил бы дефолтный выбор.
  const catalogFilterQuery = computed<LocationQuery>(() =>
    omit(buildSearchQuery(filterState.value), ['source']),
  );

  // Перезагрузка по фактическому изменению query (сравнение по JSON):
  // иммутабельные обновления фильтра меняют ссылки чаще, чем содержимое.
  const catalogFilterQueryJson = computed(() =>
    JSON.stringify(catalogFilterQuery.value),
  );

  // Каталог грузится целиком (раздел «Предметы» отдаёт его одним запросом без
  // пагинации); фильтры уходят на сервер, поиск по названию — на клиенте.
  const { data: itemsList, status: listStatus } = await useAsyncData(
    'character-sheet:items-list',
    async () => {
      const response = await $fetch<unknown>(ITEMS_SEARCH_PATH, {
        method: 'GET',
        query: { ...catalogFilterQuery.value },
        retry: 0,
      });

      return parseItemCatalog(response);
    },
    { server: false, watch: [catalogFilterQueryJson] },
  );

  const isListLoading = computed(() => listStatus.value === 'pending');

  const isListError = computed(() => listStatus.value === 'error');

  const searchTerm = ref('');

  /**
   * Фильтрация каталога по подстроке русского или английского названия.
   *
   * @param catalogItems предметы каталога.
   * @param query поисковый запрос в нижнем регистре.
   * @returns предметы, чьё название содержит запрос.
   */
  function filterItemsByName(
    catalogItems: ItemCatalogItem[],
    query: string,
  ): ItemCatalogItem[] {
    return catalogItems.filter(
      (catalogItem) =>
        catalogItem.name.toLowerCase().includes(query)
        || catalogItem.nameEng.toLowerCase().includes(query),
    );
  }

  const filteredItems = computed<ItemCatalogItem[]>(() => {
    const query = searchTerm.value.trim().toLowerCase();

    const list = itemsList.value ?? [];

    if (!query) {
      return list;
    }

    const matchedItems = filterItemsByName(list, query);

    if (matchedItems.length) {
      return matchedItems;
    }

    // Пустая выдача по запросу в неверной раскладке — пробуем конверсию
    // («ащкешашсфешщт» → «fortification»).
    const layoutQuery = convertKeyboardLayout(query).toLowerCase();

    return layoutQuery === query ? [] : filterItemsByName(list, layoutQuery);
  });

  // Дровер «Все фильтры» — переиспользованный FilterDrawer раздела; работает
  // с тем же состоянием фильтра, что и запрос каталога.
  const isFilterDrawerOpened = ref(false);

  function openFilterDrawer() {
    isFilterDrawerOpened.value = true;
  }

  /** Применяет группы из дровера «Все фильтры» с нормализацией каскада. */
  function applyFilterGroups(groups: FilterGroups): void {
    const currentFilter = filterState.value;

    if (!currentFilter) {
      return;
    }

    filterState.value = {
      ...currentFilter,
      filters: normalizeDependentSelections(groups),
    };
  }

  /** Сбрасывает выбор во всех группах фильтра, не трогая поиск. */
  function resetFilterSelections(): void {
    const currentFilter = filterState.value;

    if (!currentFilter) {
      return;
    }

    filterState.value = {
      ...currentFilter,
      filters: currentFilter.filters.map((group) => ({
        ...group,
        mode: false,
        union: false,
        values: getGroupItems(group).map((filterItem) => ({
          ...filterItem,
          selected: null,
        })),
      })),
    };
  }

  function handleFilterDrawerSave(groups: FilterGroups) {
    applyFilterGroups(groups);
    isFilterDrawerOpened.value = false;
  }

  function handleFilterDrawerReset() {
    resetFilterSelections();
    isFilterDrawerOpened.value = false;
  }

  const hasActiveFilters = computed(
    () =>
      Boolean(searchTerm.value.trim())
      || filterGroups.value.some((group) =>
        hasTouchedItem(getGroupItems(group)),
      ),
  );

  /** Полный сброс: поиск и все группы фильтра. */
  function resetFilters() {
    searchTerm.value = '';
    resetFilterSelections();
  }

  /** Черновик выбора: url новых, ещё не добавленных предметов. */
  const draftUrls = ref(new Set<string>());

  const isApplying = ref(false);

  /** Идентификаторы предметов, уже добавленных в инвентарь. */
  const existingItemIds = computed(
    () =>
      new Set(
        character.value.inventory.map((inventoryItem) => inventoryItem.id),
      ),
  );

  interface ItemCatalogRow extends ItemCatalogItem {
    isAdded: boolean;
    isSelected: boolean;
    rowClass: string;

    /** Класс курсора кнопки выбора: у добавленного предмета выбор недоступен. */
    cursorClass: string;
  }

  const displayItems = computed<ItemCatalogRow[]>(() =>
    filteredItems.value.map((catalogItem) => {
      const isAdded = existingItemIds.value.has(
        getInventoryItemId('item', catalogItem.url),
      );

      const isSelected = draftUrls.value.has(catalogItem.url);

      return {
        ...catalogItem,
        isAdded,
        isSelected,
        rowClass: isSelected ? 'bg-elevated' : '',
        cursorClass: isAdded
          ? 'cursor-default'
          : 'cursor-pointer after:cursor-pointer',
      };
    }),
  );

  const selectedCountLabel = computed(() => `Выбрано: ${draftUrls.value.size}`);

  const isApplyDisabled = computed(
    () => !draftUrls.value.size || isApplying.value,
  );

  function toggleItem(catalogRow: ItemCatalogRow) {
    if (catalogRow.isAdded) {
      return;
    }

    const nextUrls = new Set(draftUrls.value);

    if (nextUrls.has(catalogRow.url)) {
      nextUrls.delete(catalogRow.url);
    } else {
      nextUrls.add(catalogRow.url);
    }

    draftUrls.value = nextUrls;
  }

  /** Загружает деталь предмета по url; null — ответ не распознан. */
  async function fetchItemDetail(itemUrl: string): Promise<ItemSummary | null> {
    const response = await $fetch<unknown>(
      `${ITEMS_DETAIL_BASE_PATH}/${itemUrl}`,
      {
        method: 'GET',
        retry: 0,
      },
    );

    return parseItemDetail(response);
  }

  async function handleApply() {
    const urls = [...draftUrls.value];

    if (!urls.length || isApplying.value) {
      return;
    }

    isApplying.value = true;

    try {
      const results = await Promise.allSettled(urls.map(fetchItemDetail));

      const inventoryItems: CharacterInventoryItem[] = results
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((summary): summary is ItemSummary => summary !== null)
        .map(buildInventoryItem);

      if (inventoryItems.length) {
        addInventoryItems(inventoryItems);
      }

      // Часть предметов не загрузилась — сообщаем, но добавляем успешные.
      if (inventoryItems.length < urls.length) {
        toast.add({
          color: 'error',
          icon: 'tabler:alert-triangle',
          title: 'Не удалось добавить часть предметов',
        });
      }

      emit('close');
    } finally {
      isApplying.value = false;
    }
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Добавление предметов"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <!-- Высота ряда фиксирована от вьюпорта, чтобы список тянулся до низа
        модалки независимо от высоты сайдбара фильтров. -->
      <div class="flex h-[65dvh] min-h-96 flex-col gap-3 sm:flex-row sm:gap-4">
        <!-- Мобильная панель: поиск над списком + кнопка «Фильтр». -->
        <div class="flex shrink-0 items-center gap-2 sm:hidden">
          <UInput
            v-model="searchTerm"
            icon="tabler:search"
            size="sm"
            placeholder="Поиск…"
            class="min-w-0 grow"
          />

          <UButton
            icon="tabler:filter"
            label="Фильтр"
            color="neutral"
            variant="subtle"
            size="sm"
            :disabled="!filterGroups.length"
            @click.left.exact.prevent="openFilterDrawer"
          />

          <UTooltip
            v-if="hasActiveFilters"
            text="Сбросить фильтры"
          >
            <UButton
              icon="tabler:filter-off"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              aria-label="Сбросить фильтры"
              @click.left.exact.prevent="resetFilters"
            />
          </UTooltip>
        </div>

        <aside
          class="hidden w-44 shrink-0 flex-col gap-4 overflow-y-auto sm:flex"
        >
          <UInput
            v-model="searchTerm"
            icon="tabler:search"
            size="sm"
            placeholder="Поиск…"
            class="shrink-0"
          />

          <div class="flex shrink-0 items-center gap-1">
            <UButton
              icon="tabler:filter"
              label="Все фильтры"
              color="neutral"
              variant="subtle"
              size="sm"
              block
              class="min-w-0 grow"
              :disabled="!filterGroups.length"
              @click.left.exact.prevent="openFilterDrawer"
            />

            <UTooltip
              v-if="hasActiveFilters"
              text="Сбросить фильтры"
            >
              <UButton
                icon="tabler:filter-off"
                color="neutral"
                variant="ghost"
                size="sm"
                square
                aria-label="Сбросить фильтры"
                @click.left.exact.prevent="resetFilters"
              />
            </UTooltip>
          </div>
        </aside>

        <div class="flex min-w-0 grow flex-col">
          <div class="flex min-h-0 grow flex-col gap-1 overflow-y-auto pr-1">
            <div
              v-if="isListLoading"
              class="flex grow items-center justify-center py-10"
            >
              <UIcon
                name="tabler:loader-2"
                class="size-6 animate-spin text-muted"
              />
            </div>

            <div
              v-else-if="isListError"
              class="flex grow items-center justify-center py-10 text-sm text-dimmed"
            >
              Не удалось загрузить предметы
            </div>

            <template v-else>
              <div
                v-for="catalogRow in displayItems"
                :key="catalogRow.url"
                class="relative flex items-center gap-2 rounded-md pr-2 transition-colors hover:bg-elevated/60"
                :class="catalogRow.rowClass"
              >
                <button
                  type="button"
                  class="flex min-w-0 grow items-center gap-2 px-3 py-1.5 text-left after:absolute after:inset-0"
                  :class="catalogRow.cursorClass"
                  :disabled="catalogRow.isAdded"
                  :aria-label="`Выбрать предмет: ${catalogRow.name}`"
                  @click.left.exact.prevent="toggleItem(catalogRow)"
                >
                  <span class="truncate text-sm font-medium text-highlighted">
                    {{ catalogRow.name }}
                  </span>

                  <span
                    v-if="catalogRow.cost"
                    class="shrink-0 text-xs text-muted"
                  >
                    {{ catalogRow.cost }}
                  </span>
                </button>

                <UBadge
                  v-if="catalogRow.sourceLabel"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  class="relative z-10 shrink-0"
                >
                  {{ catalogRow.sourceLabel }}
                </UBadge>

                <UTooltip text="Открыть описание предмета">
                  <UButton
                    icon="tabler:layout-sidebar-right-expand"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    class="relative z-10 shrink-0"
                    :aria-label="`Описание предмета: ${catalogRow.name}`"
                    @click.left.exact.prevent="handlePreview(catalogRow.url)"
                  />
                </UTooltip>

                <UTooltip
                  v-if="catalogRow.isAdded"
                  text="Уже добавлен"
                >
                  <UIcon
                    name="tabler:check"
                    class="relative z-10 size-4 shrink-0 text-success"
                  />
                </UTooltip>

                <UIcon
                  v-else-if="catalogRow.isSelected"
                  name="tabler:check"
                  class="relative z-10 size-4 shrink-0 text-warning"
                />
              </div>

              <span
                v-if="!displayItems.length"
                class="px-3 py-6 text-center text-sm text-dimmed"
              >
                Ничего не найдено
              </span>
            </template>
          </div>
        </div>
      </div>

      <!-- Слайсовер телепортируется в body; внутри #body он держит у модалки
        единственный корень, чтобы open/after:leave от useOverlay доходили
        до UModal. -->
      <FilterDrawer
        v-if="filterGroups.length"
        v-model="isFilterDrawerOpened"
        title="Фильтры предметов"
        :groups="filterGroups"
        @save="handleFilterDrawerSave"
        @reset="handleFilterDrawerReset"
      />
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <span class="text-sm text-muted">{{ selectedCountLabel }}</span>

        <div class="flex gap-2">
          <UButton
            label="Отмена"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            label="Добавить"
            color="primary"
            :loading="isApplying"
            :disabled="isApplyDisabled"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
