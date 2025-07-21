<script setup lang="ts">
  import type { MagicItemDetailResponse } from '~magic-items/types';

  defineProps<Pick<MagicItemDetailResponse, 'subtitle'>>();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-lg bg-(--color-hover) p-3 italic">
    <span>{{ subtitle }}</span>
  </div>
</template>
