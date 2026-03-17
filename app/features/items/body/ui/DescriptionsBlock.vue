<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/model';

  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<ItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
