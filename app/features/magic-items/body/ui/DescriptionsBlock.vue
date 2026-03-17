<script setup lang="ts">
  import type { MagicItemDetailResponse } from '~magic-items/model';

  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<MagicItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
