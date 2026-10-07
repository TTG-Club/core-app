<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { Filter, FilterGroups } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterDrawer } from '../drawer';
  import { FilterInline } from '../inline';
  import {
    FILTER_CONTROLS_MORE_LABEL,
    FILTER_CONTROLS_RESET_LABEL,
    FILTER_CONTROLS_SEARCH_PLACEHOLDER,
    FILTER_CONTROLS_SHARE_LABEL,
    FILTER_FILTERS_TITLE,
    FILTER_SHARE_ICON,
    FILTER_SHARE_ICON_APPLE,
    FILTER_SOURCES_SEARCH_PLACEHOLDER,
    FILTER_SOURCES_TITLE,
  } from '../model';
  import { FilterSearchInput } from '../search-input';
  import {
    getGroupItems,
    getSelectedItemIds,
    hasTouchedItem,
    normalizeDependentSelections,
  } from '../utils';

  // Меню представления списка (группировка/сортировка), которое тулбар
  // раскладывает сам: на десктопе — отдельным рядом, на мобильном — под «⋯».
  interface PresentationMenu {
    id: string;
    label: string;
    icon: string;
    items: Array<DropdownMenuItem>;
  }

  const {
    isPending = false,
    defaults = undefined,
    presentationMenus = [],
  } = defineProps<{
    isPending?: boolean;
    defaults?: Filter;
    presentationMenus?: Array<PresentationMenu>;
  }>();

  const search = defineModel<string>('search');
  const filter = defineModel<Filter>('filter');

  const { isApple } = useDevice();
  const { share } = useCopyAndShare();

  const { greaterOrEqual } = useBreakpoints();
  const isMounted = ref(false);

  onMounted(() => {
    isMounted.value = true;
  });

  const filterOpened = ref(false);
  const sourcesOpened = ref(false);
  const localSearch = ref(toValue(search) ?? '');

  const isLarge = computed(
    () => isMounted.value && greaterOrEqual(Breakpoint.LG).value,
  );

  const shareIcon = isApple ? FILTER_SHARE_ICON_APPLE : FILTER_SHARE_ICON;

  const urlForCopy = computed(() => {
    return getOrigin() + useRoute().fullPath;
  });

  const hasPresentationMenus = computed(() => presentationMenus.length > 0);

  // Меню «⋯» собирает «Поделиться» и группировку с сортировкой. Без меню
  // представления накрывать «Поделиться» нечем, и кнопка стоит отдельно.
  const overflowItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    [
      {
        label: FILTER_CONTROLS_SHARE_LABEL,
        icon: shareIcon,
        onSelect: () => {
          share(urlForCopy.value);
        },
      },
    ],
    presentationMenus.map((menu) => ({
      label: menu.label,
      icon: menu.icon,
      children: menu.items,
    })),
  ]);

  const isFilterEdited = computed(
    () =>
      !!filter.value
      && filter.value.filters?.some((group) =>
        hasTouchedItem(getGroupItems(group)),
      ),
  );

  const isSourcesEdited = computed(() => {
    if (!filter.value?.sources) {
      return false;
    }

    if (defaults?.sources) {
      const currentKeys = filter.value.sources
        .flatMap((group) => getSelectedItemIds(group))
        .sort()
        .join(',');

      const defaultKeys = defaults.sources
        .flatMap((group) => getSelectedItemIds(group))
        .sort()
        .join(',');

      return currentKeys !== defaultKeys;
    }

    return filter.value.sources.some((group) =>
      hasTouchedItem(getGroupItems(group)),
    );
  });

  watchDebounced(
    localSearch,
    (value) => {
      if (value && value.length >= 2) {
        search.value = value;

        return;
      }

      if (!value) {
        search.value = undefined;
      }
    },
    {
      debounce: 700,
    },
  );

  /**
   * Применяет условия отбора. Встроенный список зовёт её на каждое нажатие —
   * кнопки «Применить» у него нет, выдача меняется сразу.
   */
  function applyFilter(payload: FilterGroups) {
    if (!filter.value) {
      return;
    }

    // Нормализуем перед сохранением: в дровере редактируется клон, и в payload
    // могут остаться выборы уже скрытых каскадом недоступных значений.
    filter.value = {
      ...filter.value,
      filters: normalizeDependentSelections(payload),
    };
  }

  /** Применяет выбор из дровера и закрывает его. */
  function saveFilter(payload: FilterGroups) {
    applyFilter(payload);

    filterOpened.value = false;
  }

  /** Снимает все условия отбора; источники не трогает. */
  function resetFilter() {
    if (!filter.value?.filters) {
      filterOpened.value = false;

      return;
    }

    filter.value = {
      ...filter.value,
      filters: filter.value.filters.map((group) => ({
        ...group,
        mode: false,
        union: false,
        values: getGroupItems(group).map((item) => ({
          ...item,
          selected: null,
        })),
      })),
    };

    filterOpened.value = false;
  }

  /** Применяет выбор источников из дровера и закрывает его. */
  function saveSources(payload: FilterGroups) {
    if (!filter.value) {
      return;
    }

    filter.value = { ...filter.value, sources: payload };
    sourcesOpened.value = false;
  }

  /** Возвращает источники к исходному набору раздела. */
  function resetSources() {
    if (!filter.value?.sources) {
      sourcesOpened.value = false;

      return;
    }

    if (defaults?.sources) {
      filter.value = {
        ...filter.value,
        sources: cloneDeep(defaults.sources),
      };
    } else {
      filter.value = {
        ...filter.value,
        sources: filter.value.sources.map((group) => ({
          ...group,
          values: getGroupItems(group).map((item) => ({
            ...item,
            selected: null,
          })),
        })),
      };
    }

    sourcesOpened.value = false;
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-2">
      <FilterSearchInput
        v-model="localSearch"
        class="lg:min-w-0 lg:grow"
        :placeholder="FILTER_CONTROLS_SEARCH_PLACEHOLDER"
      />

      <!-- Кнопка отбора — только на узком экране: на широком фильтры стоят -->
      <!-- в панели. Прячется стилем, а не условием, чтобы не мигать до -->
      <!-- монтирования, пока ширина ещё неизвестна. -->
      <UFieldGroup class="space-x-px lg:hidden">
        <UButton
          :disabled="!filter"
          :loading="isPending"
          icon="tabler:filter"
          :title="FILTER_FILTERS_TITLE"
          square
          block
          @click.left.exact.prevent="filterOpened = true"
        />

        <UButton
          v-if="isFilterEdited"
          :title="FILTER_CONTROLS_RESET_LABEL"
          icon="tabler:trash"
          @click.left.exact.prevent="resetFilter"
        />
      </UFieldGroup>

      <UChip :show="isSourcesEdited">
        <UButton
          :disabled="!filter"
          :loading="isPending"
          icon="tabler:books"
          :title="FILTER_SOURCES_TITLE"
          square
          @click.left.exact.prevent="sourcesOpened = true"
        />
      </UChip>

      <UButton
        v-if="!hasPresentationMenus"
        :icon="shareIcon"
        :title="FILTER_CONTROLS_SHARE_LABEL"
        square
        @click.left.exact.prevent="share(urlForCopy)"
      />

      <UDropdownMenu
        v-if="hasPresentationMenus"
        :items="overflowItems"
        :ui="{ content: 'w-56' }"
      >
        <UButton
          icon="tabler:dots"
          :title="FILTER_CONTROLS_MORE_LABEL"
          :aria-label="FILTER_CONTROLS_MORE_LABEL"
          square
        />
      </UDropdownMenu>
    </div>

    <ClientOnly>
      <template v-if="isLarge">
        <slot name="legend" />

        <!-- Те же группы, что в дровере, но прямо в панели и без «Применить». -->
        <!-- На узком экране панель — строка над списком, и отбор остаётся -->
        <!-- за кнопкой «Фильтр». -->
        <template v-if="filter?.filters">
          <USeparator />

          <FilterInline
            :groups="filter.filters"
            :is-edited="isFilterEdited"
            @update="applyFilter"
            @reset="resetFilter"
          />
        </template>
      </template>
    </ClientOnly>
  </div>

  <ClientOnly>
    <FilterDrawer
      v-if="filter?.filters"
      v-model="filterOpened"
      :title="FILTER_FILTERS_TITLE"
      :groups="filter.filters"
      @save="saveFilter"
      @reset="resetFilter"
    />

    <FilterDrawer
      v-if="filter?.sources"
      v-model="sourcesOpened"
      :title="FILTER_SOURCES_TITLE"
      :search-placeholder="FILTER_SOURCES_SEARCH_PLACEHOLDER"
      :groups="filter.sources"
      @save="saveSources"
      @reset="resetSources"
    />
  </ClientOnly>
</template>
