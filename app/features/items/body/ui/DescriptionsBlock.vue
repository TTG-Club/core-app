<script setup lang="ts">
  import type { ItemDetailResponse } from '~items/model';

  import { MarkupContent } from '~markup/content';

  const { description } =
    defineProps<Pick<ItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupContent :content="description" />
</template>
