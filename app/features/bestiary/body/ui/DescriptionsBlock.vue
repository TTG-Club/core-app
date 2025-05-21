<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { BeastDetailResponse } from '~/features/bestiary/types';

  const { description } =
    defineProps<Pick<BeastDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :entries="description" />
</template>
