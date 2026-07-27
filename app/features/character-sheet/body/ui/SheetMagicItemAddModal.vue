<script setup lang="ts">
  import type { LocationQuery } from 'vue-router';

  import type { Filter, FilterGroups } from '~infrastructure/filter';

  import type { MagicItemCatalogItem } from '../../model';

  import { omit } from 'es-toolkit';

  import {
    buildSearchQuery,
    FilterDrawer,
    getGroupItems,
    hasTouchedItem,
    normalizeDependentSelections,
    parseFilter,
  } from '~infrastructure/filter';
  import { MagicItemDrawer } from '~magic-items/drawer';

  import { useCharacterSheet } from '../../composables';
  import {
    buildMagicItemInventoryItem,
    getInventoryItemId,
    MAGIC_ITEMS_FILTERS_PATH,
    MAGIC_ITEMS_SEARCH_PATH,
    parseMagicItemCatalog,
  } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const overlay = useOverlay();

  const { character, addInventoryItems } = useCharacterSheet();

  // Дровер описания магического предмета; без destroyOnClose — повторный
  // open() после закрытия иначе падает («Overlay not found»).
  const magicItemPreviewDrawer = overlay.create(MagicItemDrawer, {
    props: {
      url: '',
      onClose: () => magicItemPreviewDrawer.close(),
    },
  });

  function handlePreview(magicItemUrl: string) {
    magicItemPreviewDrawer.open({ url: magicItemUrl });
  }

  // Полный набор групп фильтров раздела «Магические предметы».
  const { data: filterDefaults } = await useAsyncData(
    'character-sheet:magic-item-filters',
    async () => {
      const response = await $fetch<unknown>(MAGIC_ITEMS_FILTERS_PATH, {
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

  // Каталог грузится целиком (раздел отдаёт его одним запросом без пагинации);
  // фильтры уходят на сервер, поиск по названию — на клиенте.
  const { data: magicItemsList, status: listStatus } = await useAsyncData(
    'character-sheet:magic-items-list',
    async () => {
      const response = await $fetch<unknown>(MAGIC_ITEMS_SEARCH_PATH, {
        method: 'GET',
        query: { ...catalogFilterQuery.value },
        retry: 0,
      });

      return parseMagicItemCatalog(response);
    },
    { server: false, watch: [catalogFilterQueryJson] },
  );

  const isListLoading = computed(() => listStatus.value === 'pending');

  const isListError = computed(() => listStatus.value === 'error');

  const searchTerm = ref('');

  /**
   * Фильтрация каталога по подстроке русского или английского названия.
   *
   * @param catalogItems магические предметы каталога.
   * @param query поисковый запрос в нижнем регистре.
   * @returns предметы, чьё название содержит запрос.
   */
  function filterMagicItemsByName(
    catalogItems: MagicItemCatalogItem[],
    query: string,
  ): MagicItemCatalogItem[] {
    return catalogItems.filter(
      (catalogItem) =>
        catalogItem.name.toLowerCase().includes(query)
        || catalogItem.nameEng.toLowerCase().includes(query),
    );
  }

  const filteredMagicItems = computed<MagicItemCatalogItem[]>(() => {
    const query = searchTerm.value.trim().toLowerCase();

    const list = magicItemsList.value ?? [];

    if (!query) {
      return list;
    }

    const matchedItems = filterMagicItemsByName(list, query);

    if (matchedItems.length) {
      return matchedItems;
    }

    // Пустая выдача по запросу в неверной раскладке — пробуем конверсию.
    const layoutQuery = convertKeyboardLayout(query).toLowerCase();

    return layoutQuery === query
      ? []
      : filterMagicItemsByName(list, layoutQuery);
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

  /**
   * Черновик выбора: новые магические предметы по URL. Хранится сам предмет,
   * а не только URL — выбранная позиция не теряется при смене фильтров.
   */
  const draftMagicItems = ref(new Map<string, MagicItemCatalogItem>());

  /** Идентификаторы предметов, уже добавленных в инвентарь. */
  const existingItemIds = computed(
    () =>
      new Set(
        character.value.inventory.map((inventoryItem) => inventoryItem.id),
      ),
  );

  interface MagicItemCatalogRow extends MagicItemCatalogItem {
    isAdded: boolean;
    isSelected: boolean;
    rowClass: string;

    /** Класс курсора кнопки выбора: у добавленного предмета выбор недоступен. */
    cursorClass: string;
  }

  const displayMagicItems = computed<MagicItemCatalogRow[]>(() =>
    filteredMagicItems.value.map((catalogItem) => {
      const isAdded = existingItemIds.value.has(
        getInventoryItemId('magic-item', catalogItem.url),
      );

      const isSelected = draftMagicItems.value.has(catalogItem.url);

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

  const selectedCountLabel = computed(
    () => `Выбрано: ${draftMagicItems.value.size}`,
  );

  const isApplyDisabled = computed(() => !draftMagicItems.value.size);

  function toggleMagicItem(catalogRow: MagicItemCatalogRow) {
    if (catalogRow.isAdded) {
      return;
    }

    const nextItems = new Map(draftMagicItems.value);

    if (nextItems.has(catalogRow.url)) {
      nextItems.delete(catalogRow.url);
    } else {
      nextItems.set(catalogRow.url, {
        url: catalogRow.url,
        name: catalogRow.name,
        nameEng: catalogRow.nameEng,
        category: catalogRow.category,
        rarity: catalogRow.rarity,
        sourceLabel: catalogRow.sourceLabel,
      });
    }

    draftMagicItems.value = nextItems;
  }

  // Деталь не нужна: категория и редкость есть прямо в ответе поиска.
  function handleApply() {
    const catalogItems = [...draftMagicItems.value.values()];

    if (!catalogItems.length) {
      return;
    }

    addInventoryItems(catalogItems.map(buildMagicItemInventoryItem));
    emit('close');
  }

  function handleCancel() {
    emit('close');
  }
</script>

<template>
  <UModal
    title="Добавление магических предметов"
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
              Не удалось загрузить магические предметы
            </div>

            <template v-else>
              <div
                v-for="catalogRow in displayMagicItems"
                :key="catalogRow.url"
                class="relative flex items-center gap-2 rounded-md pr-2 transition-colors hover:bg-elevated/60"
                :class="catalogRow.rowClass"
              >
                <button
                  type="button"
                  class="flex min-w-0 grow items-center gap-2 px-3 py-1.5 text-left after:absolute after:inset-0"
                  :class="catalogRow.cursorClass"
                  :disabled="catalogRow.isAdded"
                  :aria-label="`Выбрать магический предмет: ${catalogRow.name}`"
                  @click.left.exact.prevent="toggleMagicItem(catalogRow)"
                >
                  <span class="truncate text-sm font-medium text-highlighted">
                    {{ catalogRow.name }}
                  </span>

                  <span
                    v-if="catalogRow.rarity"
                    class="shrink-0 text-xs text-muted"
                  >
                    {{ catalogRow.rarity }}
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

                <UTooltip text="Открыть описание магического предмета">
                  <UButton
                    icon="tabler:layout-sidebar-right-expand"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    class="relative z-10 shrink-0"
                    :aria-label="`Описание магического предмета: ${catalogRow.name}`"
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
                v-if="!displayMagicItems.length"
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
        title="Фильтры магических предметов"
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
            :disabled="isApplyDisabled"
            @click.left.exact.prevent="handleApply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
