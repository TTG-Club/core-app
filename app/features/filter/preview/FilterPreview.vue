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
    <ADivider :class="$style.divider" />

    <FilterList
      v-model="cloned"
      preview
    />
  </div>
</template>

<style module lang="scss">
  .list {
    display: flex;
    flex-direction: column;
  }

  .divider {
    margin: 4px 0 12px 0;
  }
</style>
