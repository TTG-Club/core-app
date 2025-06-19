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
    <div class="flex flex-col gap-4">
      <span v-if="preview">{{ label }}:</span>

      <USeparator
        v-else
        decorative
      >
        {{ label }}
      </USeparator>

      <div class="flex flex-wrap gap-3">
        <FilterTag
          v-for="item in filters"
          :key="item.key + item.name"
          v-model="item.selected"
          :preview
        >
          {{ item.name }}
        </FilterTag>
      </div>
    </div>
  </template>
</template>
