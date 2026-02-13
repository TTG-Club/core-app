<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/model';

  const { types } = defineProps<Pick<ItemDetailResponse, 'types'>>();
</script>

<template>
  <div class="flex flex-wrap gap-1 rounded-lg bg-elevated p-3 italic">
    <span>{{ types }}</span>
  </div>
</template>
