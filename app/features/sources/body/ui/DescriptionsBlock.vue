<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { SourceDetailResponse } from '~/features/sources/types';

  const { description } =
    defineProps<Pick<SourceDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :entries="description" />
</template>
