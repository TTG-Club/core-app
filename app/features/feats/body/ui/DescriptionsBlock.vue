<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { FeatDetailResponse } from '~/shared/types';

  const { description } =
    defineProps<Pick<FeatDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
