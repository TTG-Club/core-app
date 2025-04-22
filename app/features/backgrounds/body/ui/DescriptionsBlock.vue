<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { BackgroundDetailResponse } from '~/shared/types';

  const { description } =
    defineProps<Pick<BackgroundDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :entries="description" />
</template>
