<script setup lang="ts">
  import type { GlossaryDetailResponse } from '~glossary/model';

  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<GlossaryDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
