<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { MagicItemDetailResponse } from '~magic-items/model';

  const { description } =
    defineProps<Pick<MagicItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
