<script setup lang="ts">
  import type { HeadingNode } from '../../types';

  const { node } = defineProps<{
    node: HeadingNode;
  }>();

  const level = Number.parseInt(node.attrs.level || '1');

  if (level < 1 || level > 6) {
    throw new Error(
      `[Markup] Heading level must be between 1 and 6, got: ${level}`,
    );
  }

  const tag = `h${level}`;
</script>

<template>
  <component
    :is="tag"
    class="font-bold"
  >
    <slot />
  </component>
</template>
