<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type {
    CatalogPickerEntry,
    CatalogPickerSection,
    FilterGroups,
  } from '~infrastructure/filter';

  import { FilterDrawer, useCatalogPicker } from '~infrastructure/filter';
  import { UiResult } from '~ui/result';

  import {
    CATALOG_PICKER_LABELS,
    CATALOG_PICKER_SCROLL_THRESHOLD_PX,
  } from './constants';

  /**
   * Выбор записей каталога модалкой: слева фильтры раздела, справа список.
   *
   * Выпадающий список каталог не показывает: у предметов и заклинаний их сотни,
   * и найти нужное можно было только по названию. Фильтры здесь те же, что в
   * самом разделе, — их отдаёт бэкенд и разбирает общий `parseFilter`, поэтому
   * пикер и раздел всегда фильтруют одинаково.
   */
  const {
    section,
    title,
    multiple = false,
    excludeUrls = [],
  } = defineProps<{
    /** Раздел каталога: ручки поиска и фильтров. */
    section: CatalogPickerSection;

    /** Заголовок окна: «Предметы», «Заклинания». */
    title: string;

    /** Выбирают несколько записей; иначе одну — окно закроется сразу. */
    multiple?: boolean;

    /** Слаги, которых в списке быть не должно: их уже выбрали в другом поле. */
    excludeUrls?: Array<string>;
  }>();

  /** Уже выбранные записи: отмечены в списке и собраны отдельной вкладкой. */
  const selected = defineModel<Array<CatalogPickerEntry>>({ required: true });

  const emit = defineEmits<{
    /** Закрытие окна; записи передаются только при сохранении. */
    close: [entries?: Array<CatalogPickerEntry>];
  }>();

  const {
    searchTerm,
    filterGroups,
    hasActiveFilters,
    entries,
    isLoadingFirstPage,
    isLoadingMore,
    hasLoadError,
    hasNextPage,
    requestKey,
    reload,
    loadNextPage,
    fetchAllEntries,
    retryLoad,
    applyFilterGroups,
    resetFilters,
  } = useCatalogPicker(section);

  /**
   * Черновик выбора: список правится до сохранения, а поле — после.
   *
   * Копия делается один раз, при открытии окна: дальше окно живёт своим
   * состоянием, и связь с полем ему не нужна — оно закроется раньше, чем поле
   * успеет измениться снаружи.
   */
  const draft = ref<Array<CatalogPickerEntry>>(
    toRaw(selected.value).map((entry) => ({ ...entry })),
  );

  const selectedUrls = computed(
    () => new Set(draft.value.map((entry) => entry.url)),
  );

  const excluded = computed(() => new Set(excludeUrls));

  /** Выдача без уже занятых чужими полями записей. */
  const visibleEntries = computed(() =>
    entries.value.filter(
      (entry) =>
        !excluded.value.has(entry.url) || selectedUrls.value.has(entry.url),
    ),
  );

  const toast = useToast();

  const isFilterDrawerOpened = ref(false);

  /** Прокручиваемый список: его же прокрутка подгружает хвост выдачи. */
  const listElement = useTemplateRef<HTMLElement>('listElement');

  /** Что показывает список: весь раздел или уже отмеченное. */
  type PickerView = 'all' | 'selected';

  const activeView = ref<PickerView>('all');

  /** Отмеченное показывается вкладкой; у одиночного выбора её нет. */
  const isSelectedView = computed(
    () => multiple && activeView.value === 'selected',
  );

  /** Вкладки списка. Число на второй — единственный счётчик набранного. */
  const viewTabItems = computed<Array<TabsItem>>(() => [
    { value: 'all', label: CATALOG_PICKER_LABELS.allTab },
    {
      value: 'selected',
      label: CATALOG_PICKER_LABELS.selectedTab,
      badge: {
        label: String(draft.value.length),
        color: 'neutral',
        variant: 'subtle',
      },
    },
  ]);

  /**
   * Отмеченное, отобранное тем же поиском: набранную сотню глазами не
   * разобрать, а серверный поиск про черновик не знает — он ищет по разделу.
   */
  const selectedEntries = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();

    if (!term) {
      return draft.value;
    }

    return draft.value.filter(
      (entry) =>
        entry.name.toLowerCase().includes(term)
        || entry.nameEng.toLowerCase().includes(term),
    );
  });

  /** Записи открытой вкладки. */
  const displayedEntries = computed(() =>
    isSelectedView.value ? selectedEntries.value : visibleEntries.value,
  );

  /** Пустая выдача при законченной загрузке: искать больше нечего. */
  const isEmpty = computed(() => {
    if (isSelectedView.value) {
      return selectedEntries.value.length === 0;
    }

    return (
      !isLoadingFirstPage.value
      && !hasLoadError.value
      && visibleEntries.value.length === 0
    );
  });

  const isSelectingAll = ref(false);

  /**
   * Слаги выдачи, отмеченные галочкой «Все».
   *
   * Хвост выдачи в списке не лежит, а снять галочкой нужно ровно то, что она
   * поставила: по загруженным строкам этого не восстановить.
   */
  const coveredUrls = ref<Set<string>>(new Set());

  /** Отмечена ли вся выдача отбора. */
  const isAllSelected = computed(() => {
    if (coveredUrls.value.size) {
      return [...coveredUrls.value].every((url) => selectedUrls.value.has(url));
    }

    return (
      !hasNextPage.value
      && visibleEntries.value.length > 0
      && visibleEntries.value.every((entry) =>
        selectedUrls.value.has(entry.url),
      )
    );
  });

  /** Состояние галочки «Все»: отмечено целиком, частично или пусто. */
  const allCheckboxValue = computed<boolean | 'indeterminate'>(() => {
    if (isAllSelected.value) {
      return true;
    }

    const hasSelectedInList = visibleEntries.value.some((entry) =>
      selectedUrls.value.has(entry.url),
    );

    return hasSelectedInList ? 'indeterminate' : false;
  });

  const toggleAllAriaLabel = computed(() =>
    isAllSelected.value
      ? CATALOG_PICKER_LABELS.unselectAllAction
      : CATALOG_PICKER_LABELS.selectAllAction,
  );

  const isToggleAllDisabled = computed(
    () =>
      isSelectingAll.value
      || isLoadingFirstPage.value
      || hasLoadError.value
      || !visibleEntries.value.length,
  );

  const emptyTitle = computed(() =>
    isSelectedView.value
      ? CATALOG_PICKER_LABELS.empty
      : CATALOG_PICKER_LABELS.emptyTitle,
  );

  const emptySubtitle = computed(() => {
    if (!isSelectedView.value) {
      return CATALOG_PICKER_LABELS.emptySubtitle;
    }

    return searchTerm.value.trim()
      ? CATALOG_PICKER_LABELS.emptySelectedSearchSubtitle
      : CATALOG_PICKER_LABELS.emptySelectedSubtitle;
  });

  /**
   * Перезапрашивает выдачу под изменившийся отбор.
   *
   * Заодно забывает отметки галочки «Все»: они относились к прежнему отбору, а
   * к новому отношения не имеют.
   */
  function handleRequestChange(): void {
    coveredUrls.value = new Set();

    void reload();
  }

  // Выдача перезапрашивается на смену запроса или фильтров: ключ собран из них
  // же, поэтому лишних заходов нет — иммутабельные правки фильтра меняют ссылки
  // чаще, чем содержимое.
  watch(requestKey, handleRequestChange, { immediate: true });

  /**
   * Отмечает или снимает запись. У одиночного выбора отметка сразу закрывает
   * окно: второго значения там всё равно не будет, и лишний «Сохранить» только
   * добавлял бы шаг.
   *
   * @param entry запись каталога.
   */
  function toggle(entry: CatalogPickerEntry): void {
    if (!multiple) {
      emit('close', [{ ...entry }]);

      return;
    }

    draft.value = selectedUrls.value.has(entry.url)
      ? draft.value.filter((item) => item.url !== entry.url)
      : [...draft.value, { ...entry }];
  }

  /**
   * Переключает вкладку списка. `UTabs` отдаёт значение строкой, поэтому оно
   * сверяется со своими — чужое в состояние не попадёт.
   *
   * @param value значение вкладки.
   */
  function handleViewChange(value: string | number): void {
    activeView.value = value === 'selected' ? 'selected' : 'all';

    // Прокрутка у вкладок общая: без сброса «Выбранные» открывались бы с
    // середины — там, где остановились в выдаче раздела
    if (listElement.value) {
      listElement.value.scrollTop = 0;
    }
  }

  /**
   * Отмечает всю выдачу под текущий отбор.
   *
   * Берётся не список на экране, а вся выдача: прокруткой в нём лежат первые
   * страницы, и отбор из полусотни записей пришлось бы домечать вручную.
   */
  async function selectAll(): Promise<void> {
    const requestedKey = requestKey.value;

    isSelectingAll.value = true;

    try {
      const { entries: foundEntries, isLimitReached } = await fetchAllEntries();

      // Отбор успели сменить, пока шёл запрос: пришедшая выдача уже не та, что
      // на экране, и отмечать её нельзя
      if (requestKey.value !== requestedKey) {
        return;
      }

      const selectable = foundEntries.filter(
        (entry) => !excluded.value.has(entry.url),
      );

      const additions = selectable.filter(
        (entry) => !selectedUrls.value.has(entry.url),
      );

      draft.value = [
        ...draft.value,
        ...additions.map((entry) => ({ ...entry })),
      ];

      coveredUrls.value = new Set(selectable.map((entry) => entry.url));

      if (isLimitReached) {
        toast.add({
          title: CATALOG_PICKER_LABELS.selectAllLimitTitle,
          description: CATALOG_PICKER_LABELS.selectAllLimitSubtitle,
          color: 'warning',
        });
      }
    } catch {
      toast.add({
        title: CATALOG_PICKER_LABELS.selectAllErrorTitle,
        description: CATALOG_PICKER_LABELS.errorSubtitle,
        color: 'error',
      });
    } finally {
      isSelectingAll.value = false;
    }
  }

  /** Снимает выбор со всей выдачи отбора — ровно с того, что отметила галочка. */
  function unselectAll(): void {
    const urls = coveredUrls.value.size
      ? coveredUrls.value
      : new Set(visibleEntries.value.map((entry) => entry.url));

    draft.value = draft.value.filter((entry) => !urls.has(entry.url));
    coveredUrls.value = new Set();
  }

  /**
   * Отмечает всю выдачу отбора или снимает её же — как галочка в шапке таблицы.
   */
  async function toggleAll(): Promise<void> {
    if (isAllSelected.value) {
      unselectAll();

      return;
    }

    await selectAll();
  }

  /** Снимает весь выбор: набранную сотню снимать по одной записи нечем. */
  function clearDraft(): void {
    draft.value = [];
  }

  /**
   * Подгружает хвост выдачи, когда список прокручен почти до конца.
   *
   * @param event событие прокрутки списка.
   */
  function handleScroll(event: Event): void {
    const target = event.target;

    if (isSelectedView.value || !(target instanceof HTMLElement)) {
      return;
    }

    const rest = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (rest <= CATALOG_PICKER_SCROLL_THRESHOLD_PX) {
      void loadNextPage();
    }
  }

  /**
   * Применяет выбор фильтров из дровера.
   *
   * @param groups группы фильтра с проставленным выбором.
   */
  function handleFilterSave(groups: FilterGroups): void {
    applyFilterGroups(groups);
    isFilterDrawerOpened.value = false;
    // Фильтры отбирают раздел, а не черновик: правку видно только на вкладке
    // «Все», и оставаться на «Выбранных» после неё незачем
    activeView.value = 'all';
  }

  /** Сбрасывает фильтры к тому, какими их отдал раздел. */
  function handleFilterReset(): void {
    resetFilters();
    isFilterDrawerOpened.value = false;
    activeView.value = 'all';
  }

  /** Сохранение: выбранное уходит в поле формы. */
  function handleSave(): void {
    emit('close', draft.value);
  }

  /** Закрытие без сохранения: поле остаётся как было. */
  function handleCancel(): void {
    emit('close');
  }
</script>

<template>
  <UModal
    :title="title"
    :ui="{ content: 'max-w-4xl' }"
  >
    <template #body>
      <div class="flex h-[65dvh] min-h-96 flex-col gap-3 sm:flex-row sm:gap-4">
        <!-- Фильтры: на узком экране кнопкой над списком, на широком колонкой
          слева — как в самом разделе каталога -->
        <div class="flex shrink-0 flex-col gap-2 sm:w-52">
          <UButton
            icon="tabler:filter"
            color="neutral"
            variant="subtle"
            block
            :label="CATALOG_PICKER_LABELS.filters"
            @click.left.exact.prevent="isFilterDrawerOpened = true"
          />

          <UButton
            v-if="hasActiveFilters"
            icon="tabler:filter-off"
            color="neutral"
            variant="ghost"
            size="xs"
            block
            :label="CATALOG_PICKER_LABELS.resetFilters"
            @click.left.exact.prevent="resetFilters"
          />

          <p class="hidden text-xs text-dimmed sm:block">
            {{ CATALOG_PICKER_LABELS.filtersHint }}
          </p>
        </div>

        <div class="flex min-w-0 grow flex-col gap-3">
          <UInput
            v-model="searchTerm"
            icon="tabler:search"
            :placeholder="CATALOG_PICKER_LABELS.searchPlaceholder"
            autofocus
          />

          <!-- Отмеченное — соседней вкладкой, а не полосой чипов под списком:
            чипы росли с каждым выбором и отжимали список до пары строк, а
            набирают сюда и по сотне записей -->
          <div
            v-if="multiple"
            class="flex items-center gap-2"
          >
            <!-- Отбор сузили — берут его целиком: галочка отмечает всю выдачу и
              тем же нажатием её снимает, как в шапке таблицы -->
            <UButton
              v-if="!isSelectedView"
              color="neutral"
              variant="subtle"
              size="sm"
              class="shrink-0"
              :disabled="isToggleAllDisabled"
              :aria-label="toggleAllAriaLabel"
              :label="CATALOG_PICKER_LABELS.selectAll"
              @click.left.exact.prevent="toggleAll"
            >
              <template #leading>
                <UIcon
                  v-if="isSelectingAll"
                  name="tabler:loader-2"
                  class="size-4 animate-spin"
                />

                <UCheckbox
                  v-else
                  :model-value="allCheckboxValue"
                  tabindex="-1"
                  class="pointer-events-none"
                />
              </template>
            </UButton>

            <UTabs
              :items="viewTabItems"
              :model-value="activeView"
              :content="false"
              size="sm"
              class="min-w-0 grow"
              :ui="{ list: 'w-full' }"
              @update:model-value="handleViewChange"
            />
          </div>

          <div
            ref="listElement"
            class="min-h-0 grow overflow-y-auto rounded-md border border-default"
            @scroll="handleScroll"
          >
            <div
              v-if="isLoadingFirstPage && !isSelectedView"
              class="grid place-items-center p-6"
            >
              <UIcon
                name="tabler:loader-2"
                class="size-6 animate-spin text-dimmed"
              />
            </div>

            <UiResult
              v-else-if="hasLoadError && !isSelectedView"
              :title="CATALOG_PICKER_LABELS.errorTitle"
              :sub-title="CATALOG_PICKER_LABELS.errorSubtitle"
            >
              <UButton
                color="neutral"
                variant="subtle"
                :label="CATALOG_PICKER_LABELS.retry"
                @click.left.exact.prevent="retryLoad"
              />
            </UiResult>

            <UiResult
              v-else-if="isEmpty"
              :title="emptyTitle"
              :sub-title="emptySubtitle"
            />

            <ul
              v-else
              class="divide-y divide-default"
            >
              <li
                v-for="entry in displayedEntries"
                :key="entry.url"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-elevated/50"
                  :class="
                    selectedUrls.has(entry.url) ? 'bg-elevated/60' : undefined
                  "
                  @click.left.exact.prevent="toggle(entry)"
                >
                  <UCheckbox
                    v-if="multiple"
                    :model-value="selectedUrls.has(entry.url)"
                    tabindex="-1"
                    class="pointer-events-none"
                  />

                  <span class="flex min-w-0 grow flex-col">
                    <span class="truncate text-sm text-highlighted">
                      {{ entry.name }}
                    </span>

                    <span
                      v-if="entry.nameEng"
                      class="truncate text-xs text-dimmed"
                    >
                      {{ entry.nameEng }}
                    </span>
                  </span>

                  <UBadge
                    v-if="entry.source"
                    variant="subtle"
                    color="neutral"
                    class="shrink-0"
                  >
                    {{ entry.source }}
                  </UBadge>
                </button>
              </li>
            </ul>

            <div
              v-if="isLoadingMore && !isSelectedView"
              class="grid place-items-center py-3"
            >
              <UIcon
                name="tabler:loader-2"
                class="size-5 animate-spin text-dimmed"
              />
            </div>
          </div>
        </div>
      </div>

      <FilterDrawer
        v-model="isFilterDrawerOpened"
        :groups="filterGroups"
        :title="title"
        @save="handleFilterSave"
        @reset="handleFilterReset"
      />
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <!-- Счётчик выбранного переехал на вкладку, а место занял сброс: снимать
          набранную сотню по одной записи нечем -->
        <UButton
          v-if="multiple && draft.length"
          icon="tabler:x"
          color="neutral"
          variant="ghost"
          :label="CATALOG_PICKER_LABELS.clear"
          @click.left.exact.prevent="clearDraft"
        />

        <span v-else />

        <div class="flex gap-2">
          <UButton
            :label="CATALOG_PICKER_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="handleCancel"
          />

          <UButton
            v-if="multiple"
            :label="CATALOG_PICKER_LABELS.save"
            color="primary"
            @click.left.exact.prevent="handleSave"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
