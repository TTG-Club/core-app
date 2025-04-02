<script setup lang="ts">
  import type { FeatDetailResponse } from '~/shared/types';
  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<FeatDetailResponse, 'description' | 'category' | 'prerequsit'>>();
</script>

<template>
  <MarkupRender :entries="prerequsit" />
  <MarkupRender :entries="description" />
</template>
