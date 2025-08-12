<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { ArticlesDetailResponse } from '../../types';

  const { description } =
    defineProps<Pick<ArticlesDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :entries="description" />
</template>
