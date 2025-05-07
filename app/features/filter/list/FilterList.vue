<script setup lang="ts">
  import { FilterGroup } from './ui';

  import type { Filter } from '../types';

  const { onlyReset = false } = defineProps<{
    onlyReset?: boolean;
  }>();

  const filter = defineModel<Filter>({
    required: true,
  });
</script>

<template>
  <FilterGroup
    v-for="group in filter.groups"
    :key="group.key + group.name"
    v-model="group.filters"
    :label="group.name"
    :only-reset="onlyReset"
  />
</template>
