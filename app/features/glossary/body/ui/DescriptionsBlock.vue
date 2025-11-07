<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { GlossaryDetailResponse } from '~/shared/types';

  const { description } =
    defineProps<Pick<GlossaryDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
