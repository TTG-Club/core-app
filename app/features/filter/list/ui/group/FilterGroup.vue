<script setup lang="ts">
  import { FilterTag } from '../tag';

  import type { FilterItems } from '~filter/types';

  const { label, preview = false } = defineProps<{
    label: string;
    preview?: boolean;
  }>();

  const filters = defineModel<FilterItems>({
    required: true,
  });

  const isVisible = computed(
    () => !preview || filters.value.some((filter) => filter.selected !== null),
  );
</script>

<template>
  <template v-if="isVisible">
    <AFlex
      vertical
      gap="8"
    >
      <span v-if="preview">{{ label }}:</span>

      <ADivider
        v-else
        orientation="left"
        :style="{ margin: 0 }"
      >
        {{ label }}
      </ADivider>

      <AFlex
        wrap="wrap"
        gap="12"
      >
        <FilterTag
          v-for="item in filters"
          :key="item.key + item.name"
          v-model="item.selected"
          :preview
        >
          {{ item.name }}
        </FilterTag>
      </AFlex>
    </AFlex>
  </template>
</template>
