<script setup lang="ts">
  import type { FilterGroup, FilterGroups, SourceEntry } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { UiResult } from '~ui/result';

  import { useSourceCatalog } from '../composable';
  import {
    FILTER_DRAWER_SIDE,
    FILTER_DRAWER_UI,
    FILTER_SEARCH_DEBOUNCE,
    FILTER_SEARCH_EMPTY_SUBTITLE,
    FILTER_SEARCH_EMPTY_TITLE,
    FILTER_SELECT_ALL_LABEL,
    FILTER_SOURCES_APPLY_LABEL,
    FILTER_SOURCES_CLEAR_ALL_ICON,
    FILTER_SOURCES_CLEAR_ALL_LABEL,
    FILTER_SOURCES_PRESETS,
    FILTER_SOURCES_RESET_ICON,
    FILTER_SOURCES_RESET_LABEL,
    FILTER_SOURCES_SEARCH_ICON,
    FILTER_SOURCES_SEARCH_PLACEHOLDER,
    FILTER_SOURCES_SELECT_ALL_ICON,
    FILTER_SOURCES_SUMMARY_PREFIX,
    FILTER_SOURCES_SUMMARY_SEPARATOR,
  } from '../model';
  import { FilterSearchInput } from '../search-input';
  import {
    applySourcePreset,
    countSources,
    getGroupItems,
    getSourceEntries,
    isSourcePresetActive,
    isSourcePresetAvailable,
    searchSourceEntries,
    setSourcesSelected,
  } from '../utils';
  import { FilterSourceGroup } from './ui';

  /** Группа панели вместе с источниками, которые сейчас показаны. */
  interface VisibleSourceGroup {
    group: FilterGroup;
    index: number;
    entries: Array<SourceEntry>;
    defaultOpen: boolean;
  }

  /** Цвет кнопки быстрого набора: совпавший с выбором подсвечен. */
  function getPresetColor(isActive: boolean): 'primary' | 'neutral' {
    return isActive ? 'primary' : 'neutral';
  }

  /**
   * Панель выбора источников. Своя, а не общая панель фильтров: источник —
   * это книга с русским и английским названием и акронимом, и тегом в одну
   * строку её не показать. Выезжает слева — туда же, где стоят фильтры раздела.
   */
  defineEmits<{
    (event: 'save', value: FilterGroups): void;
    (event: 'reset'): void;
  }>();

  const { groups, title } = defineProps<{
    groups: FilterGroups;
    title: string;
  }>();

  const opened = defineModel<boolean>();

  const cloned = ref<FilterGroups>(cloneDeep(groups));
  const search = ref('');

  // Поле остаётся на `search`, чтобы ввод не тормозил; список считается по
  // значению с задержкой. Пустой запрос применяется сразу: после крестика
  // очистки список не должен ещё мгновение висеть отфильтрованным.
  const debouncedSearch = refDebounced(search, FILTER_SEARCH_DEBOUNCE);

  const appliedSearch = computed(() =>
    search.value ? debouncedSearch.value : '',
  );

  const { catalog, load } = useSourceCatalog();

  watch(
    opened,
    (value) => {
      if (!value) {
        return;
      }

      cloned.value = cloneDeep(groups);
      // Поиск — способ навигации по списку, а не часть выбора: забытый запрос
      // показал бы при следующем открытии часть книг без видимой причины.
      search.value = '';
      load();
    },
    { immediate: true },
  );

  const isSearching = computed(() => !!appliedSearch.value);

  /**
   * Какие группы раскрыты при открытии панели: те, где что-то отмечено, —
   * отмеченное не должно прятаться под шапкой. Когда не отмечено ничего,
   * раскрыты все: иначе панель встретила бы одними заголовками.
   */
  const hasAnySelection = computed(() => countSources(groups).selected > 0);

  /** Раскрыта ли группа при появлении. */
  function isGroupOpenByDefault(group: FilterGroup): boolean {
    return (
      !hasAnySelection.value
      || getGroupItems(group).some((filterItem) => filterItem.selected)
    );
  }

  const visibleGroups = computed<Array<VisibleSourceGroup>>(() =>
    cloned.value
      .map((group, index) => ({
        group,
        index,
        defaultOpen: isGroupOpenByDefault(group),
        entries: searchSourceEntries(
          group,
          getSourceEntries(group, catalog.value),
          appliedSearch.value,
        ),
      }))
      .filter((visibleGroup) => visibleGroup.entries.length > 0),
  );

  const isEmpty = computed(
    () => !!appliedSearch.value && visibleGroups.value.length === 0,
  );

  const summary = computed(() => {
    const { selected, total } = countSources(cloned.value);

    return `${FILTER_SOURCES_SUMMARY_PREFIX} ${selected} ${FILTER_SOURCES_SUMMARY_SEPARATOR} ${total}`;
  });

  /** Быстрые наборы, для которых в панели есть все нужные группы. */
  const presets = computed(() =>
    FILTER_SOURCES_PRESETS.filter((preset) =>
      isSourcePresetAvailable(cloned.value, preset.keys),
    ).map((preset) => ({
      ...preset,
      color: getPresetColor(isSourcePresetActive(cloned.value, preset.keys)),
    })),
  );

  /** Применяет быстрый набор: его группы отмечены целиком, остальные сняты. */
  function applyPreset(keys: ReadonlyArray<string>): void {
    cloned.value = applySourcePreset(cloned.value, keys);
  }

  /** Отмечено ли всё показанное: тогда кнопка панели снимает отметки. */
  const isAllVisibleSelected = computed(
    () =>
      visibleGroups.value.length > 0
      && visibleGroups.value.every((visibleGroup) =>
        visibleGroup.entries.every((entry) => entry.selected),
      ),
  );

  const toggleAllLabel = computed(() =>
    isAllVisibleSelected.value
      ? FILTER_SOURCES_CLEAR_ALL_LABEL
      : FILTER_SELECT_ALL_LABEL,
  );

  const toggleAllIcon = computed(() =>
    isAllVisibleSelected.value
      ? FILTER_SOURCES_CLEAR_ALL_ICON
      : FILTER_SOURCES_SELECT_ALL_ICON,
  );

  /** Обновляет группу без мутации массива верхнего уровня. */
  function handleGroupUpdate(index: number, updatedGroup: FilterGroup): void {
    cloned.value = cloned.value.map((group, groupIndex) =>
      groupIndex === index ? updatedGroup : group,
    );
  }

  /**
   * Одна кнопка на оба действия: отмечает все показанные источники, а когда
   * отмечены уже все — снимает отметки. Под поиском это
   * только найденное: «аркана» и «Выбрать все» отмечают одну «Неизведанную
   * аркану», не трогая остального.
   */
  function toggleVisibleSelected(): void {
    const selected = !isAllVisibleSelected.value;

    const visibleIds = new Map(
      visibleGroups.value.map((visibleGroup) => [
        visibleGroup.index,
        new Set(visibleGroup.entries.map((entry) => entry.item.id)),
      ]),
    );

    cloned.value = cloned.value.map((group, groupIndex) => {
      const ids = visibleIds.get(groupIndex);

      return ids ? setSourcesSelected(group, ids, selected) : group;
    });
  }
</script>

<template>
  <USlideover
    v-model:open="opened"
    :title
    :description="summary"
    :side="FILTER_DRAWER_SIDE"
    :ui="FILTER_DRAWER_UI"
  >
    <template #body>
      <!-- Блок растянут на padding скроллящегося body во все стороны: иначе -->
      <!-- содержимое просвечивало бы над прилипшим полем и по бокам. -->
      <div
        class="sticky -top-4 z-10 -mx-4 -mt-4 flex flex-wrap items-center gap-2 bg-default px-4 pt-4 pb-6 sm:-top-6 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6"
      >
        <FilterSearchInput
          v-model="search"
          class="basis-full"
          :placeholder="FILTER_SOURCES_SEARCH_PLACEHOLDER"
          :icon="FILTER_SOURCES_SEARCH_ICON"
        />

        <!-- Наборы действуют на весь список, а не на найденное, поэтому под -->
        <!-- поиском их нет: кнопка сняла бы отметки с книг, которых не видно. -->
        <template v-if="!isSearching">
          <UButton
            v-for="preset in presets"
            :key="preset.id"
            :label="preset.label"
            :color="preset.color"
            variant="subtle"
            size="sm"
            @click.left.exact.prevent="applyPreset(preset.keys)"
          />
        </template>

        <UButton
          :label="toggleAllLabel"
          :icon="toggleAllIcon"
          color="neutral"
          variant="subtle"
          size="sm"
          :disabled="isEmpty"
          @click.left.exact.prevent="toggleVisibleSelected"
        />
      </div>

      <UiResult
        v-if="isEmpty"
        status="info"
        :title="FILTER_SEARCH_EMPTY_TITLE"
        :sub-title="FILTER_SEARCH_EMPTY_SUBTITLE"
      />

      <div
        v-else
        class="flex flex-col gap-5"
      >
        <FilterSourceGroup
          v-for="visibleGroup in visibleGroups"
          :key="`${visibleGroup.group.key}-${visibleGroup.group.name}`"
          :model-value="visibleGroup.group"
          :entries="visibleGroup.entries"
          :default-open="visibleGroup.defaultOpen"
          :expanded="isSearching"
          @update:model-value="handleGroupUpdate(visibleGroup.index, $event)"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          :label="FILTER_SOURCES_APPLY_LABEL"
          @click.left.exact.prevent="$emit('save', cloned)"
        />

        <UButton
          :label="FILTER_SOURCES_RESET_LABEL"
          :trailing-icon="FILTER_SOURCES_RESET_ICON"
          variant="ghost"
          color="error"
          @click.left.exact.prevent="$emit('reset')"
        />
      </div>
    </template>
  </USlideover>
</template>
