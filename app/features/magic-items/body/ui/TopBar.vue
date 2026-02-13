<script setup lang="ts">
  import type { MagicItemDetailResponse } from '~magic-items/model';

  defineProps<Pick<MagicItemDetailResponse, 'subtitle'>>();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-lg bg-elevated p-3 italic">
    <span>{{ subtitle }}</span>
  </div>
</template>
