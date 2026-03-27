<script setup lang="ts">
  import type { Filter, FilterGroups } from '../types';

  import { FilterDrawer, SourcesDrawer } from '../drawer';
  import { FilterPreview } from '../preview';

  const { isPending = false, showPreview = false } = defineProps<{
    isPending?: boolean;
    showPreview?: boolean;
  }>();

  const search = defineModel<string>('search');
  const filter = defineModel<Filter>('filter');

  const route = useRoute();
  const router = useRouter();
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
      && filter.value.filters?.some((group) =>
        (group.values || group.filters || []).some(
          (item) => item.selected !== null,
        ),
      ),
  );

  const isSourcesEdited = computed(() => !!route.query.source);

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

    const query = { ...route.query };

    filter.value.filters.forEach((g) => {
      if (g.type === 'filter') {
        delete query[g.key];
        delete query[`${g.key}_mode`];
        delete query[`${g.key}_union`];
      } else if (g.type === 'singleton') {
        const items = g.values || g.filters || [];

        items.forEach((i) => {
          delete query[String(i.id)];
        });
      }
    });

    router.replace({ query });
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

    const query = { ...route.query };

    delete query.source;

    router.replace({ query });
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
      :filter-groups="filter.filters"
      @save="saveFilter"
      @reset="resetFilter"
    />

    <SourcesDrawer
      v-if="filter?.sources"
      v-model="sourcesOpened"
      :sources="filter.sources"
      @save="saveSources"
      @reset="resetSources"
    />
  </ClientOnly>
</template>
