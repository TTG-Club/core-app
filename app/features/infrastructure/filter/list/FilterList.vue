<script setup lang="ts">
  import { FilterGroup } from './ui';

  import type { Filter } from '../types';

  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const filter = defineModel<Filter>({
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
      v-for="group in filter.groups"
      :key="group.key + group.name"
      v-model="group.filters"
      :label="group.name"
      :preview
    />
  </div>
</template>
