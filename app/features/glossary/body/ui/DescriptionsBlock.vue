<script setup lang="ts">
  import type { GlossaryDetailResponse } from '~glossary/model';

  import { MarkupContent } from '~markup/content';

  const { description } =
    defineProps<Pick<GlossaryDetailResponse, 'description'>>();
</script>

<template>
  <MarkupContent :content="description" />
</template>
