<script setup lang="ts">
  import type { RenderNode } from '~ui/markup';
  import { MarkupRender } from '~ui/markup';
  import { isArray } from 'lodash-es';

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
      v-if="isArray(text)"
      :render-node="text"
    />

    <p v-else>
      <MarkupRender :render-node="text" />
    </p>
  </div>
</template>
