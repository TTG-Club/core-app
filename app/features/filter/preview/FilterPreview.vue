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
  <div :class="$style.list">
    <span> Примененные фильтры: </span>

    <FilterList
      v-model="cloned"
      only-reset
    />
  </div>
</template>

<style module lang="scss">
  .list {
    display: flex;
    flex-direction: column;
  }
</style>
