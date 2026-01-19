<script setup lang="ts">
  import { MarkupRender } from '~ui/markup';

  import type { RenderNode } from '~ui/markup';

  defineProps<{
    text: RenderNode;
    label?: string;
  }>();
</script>

<template>
  <div>
    <h5 class="float-left mr-1 font-bold italic">
      <slot v-if="$slots.default" />

      <template v-else> {{ label }}. </template>
    </h5>

    <MarkupRender
      v-if="Array.isArray(text)"
      :render-node="text"
    />

    <p v-else>
      <MarkupRender :render-node="text" />
    </p>
  </div>
</template>
