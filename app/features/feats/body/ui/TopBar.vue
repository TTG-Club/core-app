<script setup lang="ts">
  import type { FeatDetailResponse } from '~/shared/types';

  defineProps<Pick<FeatDetailResponse, 'category'>>();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-md bg-(--color-hover) p-3 italic">
    <span>{{ category }}</span>
  </div>
</template>
