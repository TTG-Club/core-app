<script setup lang="ts">
  import type { GlossaryDetailResponse } from '~/shared/types';

  defineProps<Pick<GlossaryDetailResponse, 'tags'>>();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-md bg-(--color-hover) p-3 italic">
    <span>{{ tags }}</span>
  </div>
</template>
