<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { ItemDetailResponse } from '~items/types';

  const { description } =
    defineProps<Pick<ItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
