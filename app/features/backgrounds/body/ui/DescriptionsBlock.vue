<script setup lang="ts">
  import type { BackgroundDetailResponse } from '~backgrounds/model';

  import { MarkupContent } from '~markup/content';

  const { description } =
    defineProps<Pick<BackgroundDetailResponse, 'description'>>();
</script>

<template>
  <MarkupContent :content="description" />
</template>
