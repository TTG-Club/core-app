<script setup lang="ts">
  import {
    NodeViewContent,
    nodeViewProps,
    NodeViewWrapper,
  } from '@tiptap/vue-3';

  import { validateColor, validateVariant } from '../model/validators';

  // eslint-disable-next-line vue/define-props-declaration
  const props = defineProps(nodeViewProps);

  const color = computed(() =>
    validateColor(props.node.attrs.color, 'warning'),
  );

  const variant = computed(() =>
    validateVariant(props.node.attrs.variant, 'soft'),
  );

  const styles = computed(
    () =>
      `text-${color.value} bg-${color.value}/10 border-${color.value} ring-${color.value}`,
  );
</script>

<template>
  <NodeViewWrapper class="my-2 border-l-4">
    <UCard
      :variant="variant"
      :ui="{ root: styles, body: 'sm:p-4' }"
    >
      <NodeViewContent />
    </UCard>
  </NodeViewWrapper>
</template>
