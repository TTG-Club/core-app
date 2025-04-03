<script setup lang="ts">
  import type { FeatDetailResponse } from '~/shared/types';
  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<FeatDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :entries="description" />
</template>
