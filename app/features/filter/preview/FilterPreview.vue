<script setup lang="ts">
  import type { Filter } from '../types';

  defineProps<{
    filter: Filter | undefined;
  }>();
</script>

<template>{{ filter }}</template>
