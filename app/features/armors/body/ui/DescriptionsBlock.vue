<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { ArmorDetailResponse } from '~armors/types';

  const { description } =
    defineProps<Pick<ArmorDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :entries="description" />
</template>
