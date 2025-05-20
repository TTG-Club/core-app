<script setup lang="ts">
  import { cloneDeep } from 'lodash-es';

  import { FilterButton } from './ui';

  import { Breakpoint, useBreakpoints } from '~/shared/composables';
  import { FilterDrawer } from '~filter/drawer';
  import { FilterPreview } from '~filter/preview';
  import { SvgIcon } from '~ui/icon';

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
  const isFullWidth = greaterOrEqual(Breakpoint.LG);

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
  <div :class="$style.controls">
    <AInput
      v-model:value="localSearch"
      placeholder="Введите текст..."
      allow-clear
    />

    <div :class="$style.filter">
      <FilterButton
        :full-width="isFullWidth"
        :pending="isPending"
        :disabled="!filter"
        :edited="isEdited"
        @open="opened = true"
      />

      <AButton
        v-if="isEdited"
        :style="{ flexShrink: 0 }"
        type="primary"
        @click.left.exact.prevent="reset"
      >
        <template #icon>
          <SvgIcon icon="clear" />
        </template>
      </AButton>
    </div>

    <template v-if="isFullWidth">
      <slot name="legend" />

      <ClientOnly>
        <FilterPreview
          v-if="showPreview && filter"
          v-model="filter"
        />
      </ClientOnly>
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

<style module lang="scss">
  .controls {
    display: flex;
    gap: 8px;

    @include media-min($lg) {
      flex-direction: column;
      gap: 16px;
    }
  }

  .filter {
    display: flex;
    gap: 8px;
  }
</style>
