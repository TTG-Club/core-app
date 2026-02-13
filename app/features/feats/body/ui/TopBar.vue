<script setup lang="ts">
  import type { FeatDetailResponse } from '~feats/model';

  defineProps<Pick<FeatDetailResponse, 'category'>>();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-md bg-elevated p-3 italic">
    <span>{{ category }}</span>
  </div>
</template>
