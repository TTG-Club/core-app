<script setup lang="ts">
  import { computed } from 'vue';
  import { useDiceRollHandler } from '~dice-roller/composables';

  import { getNodeText } from '../utils';

  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  const { node, renderNodes } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  const { handleRoll: executeRoll } = useDiceRollHandler();

  /**
   * Обрабатывает клик по роллеру из разметки.
   * Извлекает нотацию из атрибутов или контента узла.
   */
  function handleRoll() {
    const textContent = node.content ? getNodeText(node.content) : '';
    const notation = node.attrs?.notation || textContent;

    if (
      !notation ||
      typeof notation !== 'string' ||
      notation.trim().length === 0
    ) {
      return;
    }

    executeRoll(notation);
  }

  const children = computed(() =>
    node.content ? renderNodes(node.content) : [],
  );
</script>

<template>
  <span
    class="cursor-pointer whitespace-nowrap text-link underline decoration-dotted underline-offset-2 hover:text-link hover:decoration-solid"
    @click.left.exact.prevent="handleRoll"
  >
    <component
      :is="vnode"
      v-for="(vnode, index) in children"
      :key="index"
    />
  </span>
</template>
