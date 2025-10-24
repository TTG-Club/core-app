<script setup lang="ts">
  import { computed, type VNode } from 'vue';
  import type { ListNode, RenderChildren } from '../../types';

  const { node, deps } = defineProps<{
    node: ListNode;
    deps: RenderChildren;
  }>();

  const isOrdered = computed(() => node.attrs?.type === 'ordered');
  const tag = computed(() => (isOrdered.value ? 'ol' : 'ul'));

  const listClass = computed(() =>
    isOrdered.value
      ? 'list-decimal list-outside pl-6'
      : 'list-disc list-outside pl-6',
  );

  function isListNode(value: unknown): value is ListNode {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'list'
    );
  }

  const liBatches = computed(() => {
    const batches: VNode[][] = [];
    const content = node.content ?? [];

    for (const item of content) {
      if (Array.isArray(item)) {
        const batch = item
          .flatMap((part) => deps.toNodes(part))
          .map((n) => deps.renderNode(n));

        batches.push(batch);

        continue;
      }

      const nodes = deps.toNodes(item);

      if (nodes.length === 1 && isListNode(nodes[0])) {
        const nestedList = deps.renderNode(nodes[0]);
        const lastBatch = batches[batches.length - 1];

        if (lastBatch) {
          lastBatch.push(nestedList);
        } else {
          batches.push([nestedList]);
        }

        continue;
      }

      batches.push(nodes.map((n) => deps.renderNode(n)));
    }

    return batches;
  });
</script>

<template>
  <component
    :is="tag"
    :class="listClass"
  >
    <li
      v-for="(batch, index) in liBatches"
      :key="index"
    >
      <component
        :is="vnode"
        v-for="(vnode, vnodeIndex) in batch"
        :key="vnodeIndex"
      />
    </li>
  </component>
</template>
