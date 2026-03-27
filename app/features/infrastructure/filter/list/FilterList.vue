<script setup lang="ts">
  import type { FilterGroups } from '../types';

  import { FilterGroup } from './ui';

  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const filter = defineModel<FilterGroups>({
    required: true,
  });
</script>

<template>
  <div
    class="flex flex-col"
    :class="{
      'gap-3': preview,
      'gap-6': !preview,
    }"
  >
    <FilterGroup
      v-for="(group, index) in filter"
      :key="group.key + group.name"
      :model-value="group"
      :preview
      @update:model-value="
        (v) => {
          filter[index] = v as any;
        }
      "
    />
  </div>
</template>
