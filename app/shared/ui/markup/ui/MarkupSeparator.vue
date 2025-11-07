<script setup lang="ts">
  import { computed, type VNode } from 'vue';
  import { USeparator } from '#components';
  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  function validateColor(
    color: string | number | boolean | null | undefined,
  ):
    | 'error'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'neutral' {
    if (color === 'error') return 'error';
    if (color === 'primary') return 'primary';
    if (color === 'secondary') return 'secondary';
    if (color === 'success') return 'success';
    if (color === 'info') return 'info';
    if (color === 'warning') return 'warning';
    if (color === 'neutral') return 'neutral';

    return 'neutral';
  }

  const color = validateColor(node.attrs?.color);

  const hasContent = computed(() => node.content && node.content.length > 0);

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <USeparator
    v-if="hasContent"
    :color="color"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </USeparator>

  <USeparator
    v-else
    :color="color"
  />
</template>
