<script setup lang="ts">
  import type { Filter, FilterSection } from '../types';

  import { cloneDeep } from 'es-toolkit';

  import { FilterDrawer, SourcesDrawer } from '../drawer';
  import { FilterPreview } from '../preview';

  const { isPending = false, showPreview = false } = defineProps<{
    isPending?: boolean;
    showPreview?: boolean;
  }>();

  const search = defineModel<string>('search');
  const filter = defineModel<Filter>('filter');

  const route = useRoute();
  const { isApple } = useDevice();
  const { share } = useCopyAndShare();

  const { greaterOrEqual } = useBreakpoints();

  const filterOpened = ref(false);
  const sourcesOpened = ref(false);
  const localSearch = ref(toValue(search) ?? '');
  const isLarge = greaterOrEqual(Breakpoint.LG);

  const urlForCopy = computed(() => {
    return getOrigin() + route.fullPath;
  });

  const isFilterEdited = computed(
    () =>
      !!filter.value
      && filter.value.filter.groups.some((group) =>
        group.filters.some((item) => item.selected !== null),
      ),
  );

  const isSourcesEdited = computed(
    () =>
      !!filter.value
      && filter.value.sources.groups.some((group) =>
        group.filters.some((item) => item.selected !== null),
      ),
  );

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

  function saveFilter(payload: FilterSection) {
    if (!filter.value) {
      return;
    }

    filter.value = { ...filter.value, filter: payload };
    filterOpened.value = false;
  }

  function resetFilter() {
    if (!filter.value) {
      filterOpened.value = false;

      return;
    }

    const cloned = cloneDeep(filter.value.filter);

    filter.value = {
      ...filter.value,
      filter: {
        ...cloned,
        groups: cloned.groups.map((group) => ({
          ...group,
          filters: group.filters.map((item) => ({
            ...item,
            selected: null,
          })),
        })),
      },
    };

    filterOpened.value = false;
  }

  function saveSources(payload: FilterSection) {
    if (!filter.value) {
      return;
    }

    filter.value = { ...filter.value, sources: payload };
    sourcesOpened.value = false;
  }

  function resetSources() {
    if (!filter.value) {
      sourcesOpened.value = false;

      return;
    }

    const cloned = cloneDeep(filter.value.sources);

    filter.value = {
      ...filter.value,
      sources: {
        ...cloned,
        groups: cloned.groups.map((group) => ({
          ...group,
          filters: group.filters.map((item) => ({
            ...item,
            selected: null,
          })),
        })),
      },
    };

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
          v-if="showPreview && filter"
          v-model="filter.filter"
        />
      </template>
    </ClientOnly>
  </div>

  <ClientOnly>
    <FilterDrawer
      v-if="filter"
      v-model="filterOpened"
      :filter="filter.filter"
      @save="saveFilter"
      @reset="resetFilter"
    />

    <SourcesDrawer
      v-if="filter"
      v-model="sourcesOpened"
      :sources="filter.sources"
      @save="saveSources"
      @reset="resetSources"
    />
  </ClientOnly>
</template>
