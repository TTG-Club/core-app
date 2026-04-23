<script setup lang="ts">
  import type { FeatDetailResponse } from '~feats/model';

  import { MarkupContent } from '~markup/content';

  const { description } =
    defineProps<Pick<FeatDetailResponse, 'description'>>();
</script>

<template>
  <MarkupContent :content="description" />
</template>
