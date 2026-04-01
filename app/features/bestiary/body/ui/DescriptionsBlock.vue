<script setup lang="ts">
  import type { CreatureDetailResponse } from '~bestiary/model';

  import { MarkupContent } from '~markup/content';

  const { description } =
    defineProps<Pick<CreatureDetailResponse, 'description'>>();
</script>

<template>
  <MarkupContent :content="description" />
</template>
