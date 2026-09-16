<script setup lang="ts">
  import type { MagicItemDetailResponse } from '../../model';

  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<MagicItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
