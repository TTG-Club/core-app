<script setup lang="ts">
  import { FilterTag } from '../tag';

  import type { FilterItems } from '~infrastructure/filter/types';

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
    <div
      class="flex flex-col"
      :class="!preview ? 'gap-0' : 'gap-2'"
    >
      <span v-if="preview">{{ label }}:</span>

      <span
        v-else
        class="rounded-t-xl border border-default px-3 py-2"
      >
        {{ label }}
      </span>

      <div
        class="flex flex-wrap"
        :class="
          !preview
            ? 'gap-3 rounded-b-xl border-x border-b border-default px-3 py-4'
            : 'gap-2'
        "
      >
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
