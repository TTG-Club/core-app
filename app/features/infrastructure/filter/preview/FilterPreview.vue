<script setup lang="ts">
  import { FilterList } from '../list';

  import type { Filter } from '../types';

  const filter = defineModel<Filter>({ required: true });

  const { cloned, isModified } = useCloned(filter);

  watch(isModified, (value) => {
    if (!value) {
      return;
    }

    filter.value = cloned.value;
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
