<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { CreatureDetailResponse } from '~/features/bestiary/types';

  const { description } =
    defineProps<Pick<CreatureDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
