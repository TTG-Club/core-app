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

  // В редакторе картинка обтекается текстом и выравнивается всегда, без оглядки
  // на ширину колонки: автору важно видеть, что он настроил. На странице в узкой
  // колонке картинка встаёт на всю ширину (см. MarkupImage).
  const placementClass = computed(() => {
    if (image.value?.float === 'left') {
      return 'float-left clear-left mr-4';
    }

    if (image.value?.float === 'right') {
      return 'float-right clear-right ml-4';
    }

    if (image.value?.align === 'left') {
      return 'clear-both mr-auto';
    }

    if (image.value?.align === 'right') {
      return 'clear-both ml-auto';
    }

    return 'clear-both mx-auto';
  });

  // Выделенная картинка залита цветом выделения текста и обведена рамкой: по
  // одной рамке на тёмном фоне выделение легко не заметить.
  const selectedClass = computed(() => (selected ? 'ring-2 ring-primary' : ''));

  const wrapperStyle = computed(() =>
    image.value
      ? { [IMAGE_WIDTH_VARIABLE]: `${getImageWidth(image.value)}%` }
      : undefined,
  );
</script>

<template>
  <NodeViewWrapper
    as="figure"
    class="relative mb-2 w-(--markup-image-width) max-w-full cursor-pointer rounded-lg"
    :class="[placementClass, selectedClass]"
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
      v-if="selected"
      class="pointer-events-none absolute inset-0 rounded-lg bg-primary/30"
      aria-hidden="true"
    />

    <span
      v-if="!image"
      class="block rounded-lg bg-elevated p-3 text-sm text-muted"
    >
      {{ MARKUP_IMAGE_EMPTY_LABEL }}
    </span>
  </NodeViewWrapper>
</template>
