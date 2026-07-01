<script setup lang="ts">
  import type { NodeViewProps } from '@tiptap/vue-3';

  import { NodeViewWrapper } from '@tiptap/vue-3';

  import { renderMarkerChip } from './render-chip';

  const { node } = defineProps<NodeViewProps>();

  const raw = computed(() => String(node.attrs.raw ?? ''));
  const chip = computed(() => renderMarkerChip(raw.value));
</script>

<template>
  <NodeViewWrapper
    as="span"
    class="ttg-marker-chip rounded-sm bg-elevated/40 px-0.5"
    :title="raw"
  >
    <component :is="chip" />
  </NodeViewWrapper>
</template>
