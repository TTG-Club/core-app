<script setup lang="ts">
  import type { FeatDetailResponse } from '~feats/model';

  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<FeatDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
