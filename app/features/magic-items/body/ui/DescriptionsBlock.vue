<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { MagicItemDetailResponse } from '~magic-items/types';

  const { description } =
    defineProps<Pick<MagicItemDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :entries="description" />
</template>
