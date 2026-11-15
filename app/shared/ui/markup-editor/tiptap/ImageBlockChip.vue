<script setup lang="ts">
  import type { NodeViewProps } from '@tiptap/vue-3';

  import { NodeViewWrapper } from '@tiptap/vue-3';

  import {
    getImageWidth,
    IMAGE_WIDTH_VARIABLE,
    readImageAttributes,
  } from '~ui/markup';

  import { MARKUP_IMAGE_EMPTY_LABEL } from '../constants';

  const { node, selected } = defineProps<NodeViewProps>();

  const image = computed(() => readImageAttributes(node.attrs));

  // В редакторе картинка обтекается текстом всегда, без оглядки на ширину
  // колонки: автору важно видеть, что он настроил. На странице в узкой колонке
  // обтекание отключается (см. MarkupImage).
  const floatClass = computed(() => {
    if (image.value?.float === 'left') {
      return 'float-left clear-left mr-4';
    }

    if (image.value?.float === 'right') {
      return 'float-right clear-right ml-4';
    }

    return 'clear-both mx-auto';
  });

  const selectedClass = computed(() =>
    selected ? 'outline-2 outline-offset-2 outline-primary' : '',
  );

  const wrapperStyle = computed(() =>
    image.value
      ? { [IMAGE_WIDTH_VARIABLE]: `${getImageWidth(image.value)}%` }
      : undefined,
  );
</script>

<template>
  <NodeViewWrapper
    as="figure"
    class="mb-2 w-(--markup-image-width) max-w-full cursor-pointer rounded-lg"
    :class="[floatClass, selectedClass]"
    :style="wrapperStyle"
    data-drag-handle
  >
    <template v-if="image">
      <img
        :src="image.url"
        :alt="image.alt"
        class="block w-full rounded-lg"
        draggable="false"
      />

      <figcaption
        v-if="image.caption"
        class="mt-1 text-center text-sm text-muted"
      >
        {{ image.caption }}
      </figcaption>
    </template>

    <span
      v-else
      class="block rounded-lg bg-elevated p-3 text-sm text-muted"
    >
      {{ MARKUP_IMAGE_EMPTY_LABEL }}
    </span>
  </NodeViewWrapper>
</template>
