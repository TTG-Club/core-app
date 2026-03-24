<script setup lang="ts">
  import type { FilterSection } from '../types';

  import { FilterGroup } from './ui';

  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const filter = defineModel<FilterSection>({
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
