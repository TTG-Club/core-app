<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';

  import { FilterDrawer } from '~filter/drawer';
  import { FilterPreview } from '~filter/preview';

  import type { Filter } from '~filter/types';

  const { isPending = false, showPreview = false } = defineProps<{
    isPending?: boolean;
    showPreview?: boolean;
  }>();

  const search = defineModel<string>('search');
  const filter = defineModel<Filter>('filter');

  const { greaterOrEqual } = useBreakpoints();

  const opened = ref(false);
  const localSearch = ref(toValue(search) ?? '');
  const isLarge = greaterOrEqual(Breakpoint.LG);

  const isEdited = computed(
    () =>
      !!filter.value &&
      filter.value.groups.some((group) =>
        group.filters.some((item) => item.selected !== null),
      ),
  );

  watchDebounced(
    localSearch,
    (value) => {
      search.value = value;
    },
    {
      debounce: 700,
    },
  );

  function save(payload: Filter) {
    filter.value = payload;
    close();
  }

  function reset() {
    if (!filter.value) {
      close();

      return;
    }

    const cloned = cloneDeep(filter.value);

    filter.value = {
      ...cloned,
      groups: cloned.groups.map((group) => ({
        ...group,
        filters: group.filters.map((item) => ({
          ...item,
          selected: null,
        })),
      })),
    };

    close();
  }

  function close() {
    opened.value = false;
  }
</script>

<template>
  <div class="flex gap-2 lg:flex-col lg:gap-4">
    <UInput
      v-model="localSearch"
      placeholder="Введите текст..."
      allow-clear
    />

    <div class="flex gap-2">
      <UChip
        :show="isEdited"
        class="lg:flex-auto"
      >
        <UButton
          :disabled="!filter"
          :loading="isPending"
          icon="i-fluent-filter-16-regular"
          label="Фильтр"
          block
          @click.left.exact.prevent="opened = true"
        />
      </UChip>

      <UButton
        v-if="isEdited"
        title="Очистить фильтр"
        icon="i-ttg-remove"
        @click.left.exact.prevent="reset"
      />
    </div>

    <template v-if="isLarge">
      <slot name="legend" />

      <FilterPreview
        v-if="showPreview && filter"
        v-model="filter"
      />
    </template>
  </div>

  <FilterDrawer
    v-if="filter"
    v-model="opened"
    :filter="filter"
    @save="save"
    @reset="reset"
  />
</template>
