<script setup lang="ts">
  import type { FilterGroup, FilterGroups } from '../types';

  import { FilterGroup as FilterGroupComponent } from './ui';

  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const filter = defineModel<FilterGroups>({
    required: true,
  });

  function handleGroupUpdate(index: number, updatedGroup: FilterGroup) {
    const updated = [...filter.value];

    updated[index] = updatedGroup;
    filter.value = updated;
  }
</script>

<template>
  <div
    class="flex flex-col"
    :class="{
      'gap-3': preview,
      'gap-6': !preview,
    }"
  >
    <FilterGroupComponent
      v-for="(group, index) in filter"
      :key="`${group.key}-${group.name}`"
      :model-value="group"
      :preview
      @update:model-value="handleGroupUpdate(index, $event)"
    />
  </div>
</template>
