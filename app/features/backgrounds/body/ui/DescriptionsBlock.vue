<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { BackgroundDetailResponse } from '~backgrounds/model';

  const { description } =
    defineProps<Pick<BackgroundDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
