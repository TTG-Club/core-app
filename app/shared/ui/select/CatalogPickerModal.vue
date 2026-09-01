<script setup lang="ts">
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

  /** Уже выбранные записи: отмечены в списке и лежат в подвале окна. */
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
    requestKey,
    reload,
    loadNextPage,
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

  const isFilterDrawerOpened = ref(false);

  /** Пустая выдача при законченной загрузке: искать больше нечего. */
  const isEmpty = computed(
    () =>
      !isLoadingFirstPage.value
      && !hasLoadError.value
      && visibleEntries.value.length === 0,
  );

  // Выдача перезапрашивается на смену запроса или фильтров: ключ собран из них
  // же, поэтому лишних заходов нет — иммутабельные правки фильтра меняют ссылки
  // чаще, чем содержимое.
  watch(requestKey, () => void reload(), { immediate: true });

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
   * Убирает запись из выбранного по чипу в подвале.
   *
   * @param url слаг записи.
   */
  function remove(url: string): void {
    draft.value = draft.value.filter((entry) => entry.url !== url);
  }

  /**
   * Подгружает хвост выдачи, когда список прокручен почти до конца.
   *
   * @param event событие прокрутки списка.
   */
  function handleScroll(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
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
  }

  /** Сбрасывает фильтры к тому, какими их отдал раздел. */
  function handleFilterReset(): void {
    resetFilters();
    isFilterDrawerOpened.value = false;
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

          <div
            class="min-h-0 grow overflow-y-auto rounded-md border border-default"
            @scroll="handleScroll"
          >
            <div
              v-if="isLoadingFirstPage"
              class="grid place-items-center p-6"
            >
              <UIcon
                name="tabler:loader-2"
                class="size-6 animate-spin text-dimmed"
              />
            </div>

            <UiResult
              v-else-if="hasLoadError"
              :title="CATALOG_PICKER_LABELS.errorTitle"
              :subtitle="CATALOG_PICKER_LABELS.errorSubtitle"
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
              :title="CATALOG_PICKER_LABELS.emptyTitle"
              :subtitle="CATALOG_PICKER_LABELS.emptySubtitle"
            />

            <ul
              v-else
              class="divide-y divide-default"
            >
              <li
                v-for="entry in visibleEntries"
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
              v-if="isLoadingMore"
              class="grid place-items-center py-3"
            >
              <UIcon
                name="tabler:loader-2"
                class="size-5 animate-spin text-dimmed"
              />
            </div>
          </div>

          <!-- Выбранное перед глазами: в длинном списке отметки уезжают вверх,
            и без чипов непонятно, что уже набрано -->
          <div
            v-if="multiple && draft.length"
            class="flex flex-wrap gap-1"
          >
            <UBadge
              v-for="entry in draft"
              :key="entry.url"
              color="neutral"
              variant="subtle"
              class="gap-1"
            >
              {{ entry.name }}

              <UButton
                icon="tabler:x"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="`${CATALOG_PICKER_LABELS.remove}: ${entry.name}`"
                @click.left.exact.prevent="remove(entry.url)"
              />
            </UBadge>
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
        <span class="text-xs text-dimmed">
          {{
            multiple ? `${CATALOG_PICKER_LABELS.chosen}: ${draft.length}` : ''
          }}
        </span>

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
