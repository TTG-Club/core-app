<script setup lang="ts">
  import type { MagicItemDetailResponse } from '~magic-items/model';

  import { MarkupContent } from '~markup/content';

  const { description } =
    defineProps<Pick<MagicItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupContent :content="description" />
</template>
