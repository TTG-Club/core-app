<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { Filter, FilterGroups } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterDrawer } from '../drawer';
  import { FilterPreview } from '../preview';
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
    showPreview = false,
    defaults = undefined,
    presentationMenus = [],
  } = defineProps<{
    isPending?: boolean;
    showPreview?: boolean;
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

  const urlForCopy = computed(() => {
    return getOrigin() + useRoute().fullPath;
  });

  const hasPresentationMenus = computed(() => presentationMenus.length > 0);

  // Отдельная кнопка «Поделиться» — на десктопе всегда, а на мобильном только
  // когда её нечем накрыть (нет меню представления, чтобы собрать «⋯»).
  const showStandaloneShare = computed(
    () => isLarge.value || !hasPresentationMenus.value,
  );

  // Меню «⋯» собирает «Поделиться» + группировку/сортировку — только на мобильном.
  const showOverflowMenu = computed(
    () => !isLarge.value && hasPresentationMenus.value,
  );

  // Второй ряд тулбара с меню представления — только на десктопе.
  const showPresentationRow = computed(
    () => isLarge.value && hasPresentationMenus.value,
  );

  const overflowItems = computed<Array<Array<DropdownMenuItem>>>(() => [
    [
      {
        label: 'Поделиться ссылкой',
        icon: isApple ? 'tabler:share-2' : 'tabler:share',
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

  function saveFilter(payload: FilterGroups) {
    if (!filter.value) {
      return;
    }

    // Нормализуем перед сохранением: в дровере редактируется клон, и в payload
    // могут остаться выборы уже скрытых каскадом недоступных значений.
    filter.value = {
      ...filter.value,
      filters: normalizeDependentSelections(payload),
    };

    filterOpened.value = false;
  }

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

  function saveSources(payload: FilterGroups) {
    if (!filter.value) {
      return;
    }

    filter.value = { ...filter.value, sources: payload };
    sourcesOpened.value = false;
  }

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
  <div class="flex gap-2 lg:flex-col lg:gap-4">
    <UInput
      v-model="localSearch"
      placeholder="Поиск..."
      allow-clear
      :ui="{ trailing: 'pe-0.5' }"
    >
      <template
        v-if="localSearch"
        #trailing
      >
        <UButton
          icon="tabler:x"
          variant="link"
          color="neutral"
          size="sm"
          @click.left.exact.prevent="localSearch = ''"
        />
      </template>
    </UInput>

    <div class="flex gap-2">
      <UFieldGroup class="w-full space-x-px">
        <UButton
          :disabled="!filter"
          :loading="isPending"
          icon="tabler:filter"
          :label="isLarge ? 'Фильтр' : undefined"
          :square="!isLarge"
          block
          @click.left.exact.prevent="filterOpened = true"
        />

        <UButton
          v-if="isFilterEdited"
          title="Очистить фильтр"
          icon="tabler:trash"
          @click.left.exact.prevent="resetFilter"
        />
      </UFieldGroup>

      <UChip :show="isSourcesEdited">
        <UButton
          :disabled="!filter"
          :loading="isPending"
          icon="tabler:books"
          title="Источники"
          square
          @click.left.exact.prevent="sourcesOpened = true"
        />
      </UChip>

      <UButton
        v-if="showStandaloneShare"
        :icon="isApple ? 'tabler:share-2' : 'tabler:share'"
        title="Поделиться ссылкой"
        square
        @click.left.exact.prevent="share(urlForCopy)"
      />

      <UDropdownMenu
        v-if="showOverflowMenu"
        :items="overflowItems"
        :ui="{ content: 'w-56' }"
      >
        <UButton
          icon="tabler:dots"
          title="Ещё"
          aria-label="Ещё"
          square
        />
      </UDropdownMenu>
    </div>

    <div
      v-if="showPresentationRow"
      class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2"
    >
      <UDropdownMenu
        v-for="menu in presentationMenus"
        :key="menu.id"
        :items="menu.items"
        :ui="{ content: 'w-56' }"
      >
        <UButton
          :icon="menu.icon"
          :label="menu.label"
          trailing-icon="tabler:chevron-down"
          color="neutral"
          variant="subtle"
          block
        />
      </UDropdownMenu>
    </div>

    <ClientOnly>
      <template v-if="isLarge">
        <slot name="legend" />

        <FilterPreview
          v-if="showPreview && filter?.filters"
          v-model="filter.filters"
        />
      </template>
    </ClientOnly>
  </div>

  <ClientOnly>
    <FilterDrawer
      v-if="filter?.filters"
      v-model="filterOpened"
      title="Фильтры"
      :groups="filter.filters"
      @save="saveFilter"
      @reset="resetFilter"
    />

    <FilterDrawer
      v-if="filter?.sources"
      v-model="sourcesOpened"
      title="Источники"
      :groups="filter.sources"
      @save="saveSources"
      @reset="resetSources"
    />
  </ClientOnly>
</template>
