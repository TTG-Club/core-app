<script setup lang="ts">
  import { FilterDrawer } from '../drawer';

  import { SvgIcon } from '~ui/icon';

  import type { Filter } from '../types';

  const filter = defineModel<Filter>();

  const { isPending } = defineProps<{
    isPending: boolean;
  }>();

  const opened = ref(false);

  const isEdited = computed(
    () =>
      !!filter.value &&
      filter.value.groups.some((group) =>
        group.filters.some((item) => item.selected !== null),
      ),
  );
</script>

<template>
  <ABadge
    :offset="[-1, 1]"
    :class="$style.badge"
    :dot="isEdited"
    title="Количество примененных фильтров"
  >
    <AButton
      :loading="isPending"
      :style="{ boxShadow: 'none' }"
      :disabled="!filter"
      type="primary"
      @click.left.exact.prevent="opened = true"
    >
      <span>Фильтр</span>

      <template #icon>
        <SvgIcon icon="filter/outline" />
      </template>
    </AButton>
  </ABadge>

  <FilterDrawer
    v-if="filter"
    v-model="filter"
    v-model:opened="opened"
  />
</template>

<style module lang="scss">
  .badge {
    :global {
      .ant-badge-dot {
        width: 12px;
        height: 12px;
        border: 2px solid var(--color-bg-main);
        box-shadow: none;
      }
    }
  }
</style>
