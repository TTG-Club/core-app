<script setup lang="ts">
  import { FilterTag } from '../tag';

  import type { FilterItems } from '~filter/types';

  const { label, onlyReset = false } = defineProps<{
    label: string;
    onlyReset?: boolean;
  }>();

  const filters = defineModel<FilterItems>({
    required: true,
  });

  const isVisible = computed(
    () =>
      !onlyReset || filters.value.some((filter) => filter.selected !== null),
  );
</script>

<template>
  <template v-if="isVisible">
    <AFlex
      vertical
      gap="8"
      :class="$style.block"
    >
      <span>{{ label }}:</span>

      <AFlex
        wrap="wrap"
        gap="12"
      >
        <FilterTag
          v-for="item in filters"
          :key="item.key + item.name"
          v-model="item.selected"
          :only-reset="onlyReset"
        >
          {{ item.name }}
        </FilterTag>
      </AFlex>
    </AFlex>
  </template>
</template>

<style lang="scss" module>
  .block {
    margin-bottom: 16px;
  }
</style>
