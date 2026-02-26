<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { SourceDetailResponse } from '~sources/types';

  const { description } =
    defineProps<Pick<SourceDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
