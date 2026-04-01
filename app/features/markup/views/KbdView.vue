<script setup lang="ts">
  import {
    NodeViewContent,
    nodeViewProps,
    NodeViewWrapper,
  } from '@tiptap/vue-3';

  import {
    validateColor,
    validateSize,
    validateVariant,
  } from '../model/validators';

  // eslint-disable-next-line vue/define-props-declaration
  const props = defineProps(nodeViewProps);

  const color = computed(() =>
    validateColor(props.node.attrs.color, 'neutral'),
  );

  const variant = computed(() =>
    validateVariant(props.node.attrs.variant, 'soft'),
  );

  const size = computed(() => validateSize(props.node.attrs.size, 'md'));
</script>

<template>
  <NodeViewWrapper as="span">
    <UKbd
      :color="color"
      :variant="variant"
      :size="size"
    >
      <NodeViewContent as="span" />
    </UKbd>
  </NodeViewWrapper>
</template>
