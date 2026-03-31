<script setup lang="ts">
  import type { CreatureDetailResponse } from '~bestiary/model';

  import { MarkupRender } from '~ui/markup';

  const { description } =
    defineProps<Pick<CreatureDetailResponse, 'description'>>();
</script>

<template>
  <MarkupRender :render-node="description" />
</template>
