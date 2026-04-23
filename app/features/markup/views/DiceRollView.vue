<script setup lang="ts">
  import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';

  import { useDiceRollHandler } from '~dice-roller/composables';

  // eslint-disable-next-line vue/define-props-declaration
  const props = defineProps(nodeViewProps);

  const { handleRoll } = useDiceRollHandler();

  const notation = computed(() => props.node.attrs.notation as string);

  function onRoll() {
    if (notation.value) {
      handleRoll(notation.value);
    }
  }
</script>

<template>
  <NodeViewWrapper
    as="span"
    class="cursor-pointer whitespace-nowrap text-link underline decoration-dotted underline-offset-2 hover:decoration-solid"
    @click.left.exact.prevent="onRoll"
  >
    {{ notation }}
  </NodeViewWrapper>
</template>
