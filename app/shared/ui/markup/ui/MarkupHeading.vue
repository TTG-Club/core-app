<script setup lang="ts">
  import { computed, type VNode } from 'vue';
  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Пользовательский уровень 1-4
  const userLevel = Number.parseInt(node.attrs?.level?.toString() || '1');

  if (userLevel < 1 || userLevel > 4) {
    throw new Error(
      `[Markup] Heading level must be between 1 and 4, got: ${userLevel}`,
    );
  }

  // Маппинг: пользовательский 1-4 → реальный 3-6
  const actualLevel = userLevel + 2; // 1→3, 2→4, 3→5, 4→6
  const tag = `h${actualLevel}` as 'h3' | 'h4' | 'h5' | 'h6';

  // Стили для каждого уровня
  const headingClasses = computed(() => {
    const baseClasses = 'font-semibold text-default tracking-tight';

    switch (userLevel) {
      case 1: // h3 - главный в контенте
        return `${baseClasses} text-xl mt-6 mb-3 border-b border-default pb-2`;
      case 2: // h4 - подраздел
        return `${baseClasses} text-lg mt-5 mb-2`;
      case 3: // h5 - мелкий раздел
        return `${baseClasses} text-base mt-4 mb-2`;
      case 4: // h6 - минимальный
        return `${baseClasses} text-sm mt-3 mb-1 uppercase tracking-wide`;
      default:
        return baseClasses;
    }
  });

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <component
    :is="tag"
    :class="headingClasses"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </component>
</template>
