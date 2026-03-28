<script setup lang="ts">
  import type { Filter, FilterGroups } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterDrawer } from '../drawer';
  import { FilterPreview } from '../preview';
  import { getGroupItems } from '../utils';

  const defaultFilter = inject<Ref<Filter | undefined>>('filterDefaults');

  const { isPending = false, showPreview = false } = defineProps<{
    isPending?: boolean;
    showPreview?: boolean;
  }>();

  const search = defineModel<string>('search');
  const filter = defineModel<Filter>('filter');

  const { isApple } = useDevice();
  const { share } = useCopyAndShare();

  const { greaterOrEqual } = useBreakpoints();

  const filterOpened = ref(false);
  const sourcesOpened = ref(false);
  const localSearch = ref(toValue(search) ?? '');
  const isLarge = greaterOrEqual(Breakpoint.LG);

  const urlForCopy = computed(() => {
    return getOrigin() + useRoute().fullPath;
  });

  const isFilterEdited = computed(
    () =>
      !!filter.value
      && filter.value.filters?.some((group) =>
        getGroupItems(group).some((item) => item.selected !== null),
      ),
  );

  const isSourcesEdited = computed(() => {
    if (!filter.value?.sources) {
      return false;
    }

    return filter.value.sources.some((group) =>
      getGroupItems(group).some((item) => item.selected !== null),
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

    filter.value = { ...filter.value, filters: payload };
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

    if (defaultFilter?.value?.sources) {
      filter.value = {
        ...filter.value,
        sources: cloneDeep(defaultFilter.value.sources),
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
          label="Фильтр"
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
        :icon="isApple ? 'tabler:share-2' : 'tabler:share'"
        title="Поделиться ссылкой"
        square
        @click.left.exact.prevent="share(urlForCopy)"
      />
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
