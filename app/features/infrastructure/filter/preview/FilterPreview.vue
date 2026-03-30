<script setup lang="ts">
  import type { FilterGroups } from '../types';

  import { FilterList } from '../list';

  const filterGroups = defineModel<FilterGroups>({ required: true });

  const { cloned, isModified } = useCloned(filterGroups);

  watch(isModified, (value) => {
    if (!value) {
      return;
    }

    filterGroups.value = cloned.value;
  });
</script>

<template>
  <div class="flex flex-col gap-2 lg:gap-4">
    <USeparator />

    <FilterList
      v-model="cloned"
      preview
    />
  </div>
</template>
