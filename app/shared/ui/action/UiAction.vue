<script setup lang="ts">
  import type { JSONContent } from '@tiptap/core';

  import { MarkupContent } from '~markup/content';

  defineProps<{
    text: JSONContent;
    label?: string;
  }>();
</script>

<template>
  <div>
    <h5 class="float-left mr-1 font-bold italic">
      <slot v-if="$slots.default" />

      <template v-else> {{ label }}. </template>
    </h5>

    <MarkupContent :content="text" />
  </div>
</template>
