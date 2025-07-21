<script setup lang="ts">
  import type { CreatureDetailResponse } from '~bestiary/types';

  defineProps<Pick<CreatureDetailResponse, 'header'>>();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-md bg-(--color-hover) p-3 italic">
    <span>{{ header }}</span>
  </div>
</template>
