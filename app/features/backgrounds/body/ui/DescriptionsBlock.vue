<script setup lang="ts">
  import type { BackgroundDetailResponse } from '~backgrounds/model';

  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<BackgroundDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
