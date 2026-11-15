<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  import { UiGallery } from '~ui/gallery';

  import {
    IMAGE_ALIGN_CLASSES,
    IMAGE_FLOAT_CLASSES,
    IMAGE_NARROW_WIDTH_VARIABLE,
    IMAGE_WIDTH_VARIABLE,
  } from '../consts';
  import {
    getImageNarrowWidth,
    getImageWidth,
    IMAGE_DEFAULT_ALIGN,
    readImageAttributes,
  } from '../image';

  // `renderNodes` приходит всем компонентам маркеров (см. renderer.ts); картинке
  // он не нужен — вложенной разметки у неё нет.
  const { node } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Без адреса (или с небезопасным адресом) рисовать нечего: блок пропускается,
  // остальной текст остаётся на месте.
  const image = computed(() => readImageAttributes(node.attrs));

  // Обтекание и ширина в процентах включаются только в широкой колонке
  // (контейнерный запрос к обёртке MarkupRender). В узкой — телефон, дровер,
  // карточка в списке — текст картинку не обтекает, а сама она держит размер
  // широкой колонки, пока помещается (см. getImageNarrowWidth).
  const figureClass = computed(() =>
    image.value?.float
      ? IMAGE_FLOAT_CLASSES[image.value.float]
      : IMAGE_ALIGN_CLASSES[image.value?.align ?? IMAGE_DEFAULT_ALIGN],
  );

  // Описание для тех, кто не видит картинку; не задано — берётся подпись.
  const alternativeText = computed(
    () => image.value?.alt ?? image.value?.caption,
  );

  const figureStyle = computed(() =>
    image.value
      ? {
          [IMAGE_WIDTH_VARIABLE]: `${getImageWidth(image.value)}%`,
          [IMAGE_NARROW_WIDTH_VARIABLE]: getImageNarrowWidth(image.value),
        }
      : undefined,
  );
</script>

<template>
  <figure
    v-if="image"
    :class="figureClass"
    :style="figureStyle"
  >
    <UiGallery
      :preview="image.url"
      :alt="alternativeText"
      disable-square
    />

    <figcaption
      v-if="image.caption"
      class="mt-1 text-center text-sm text-muted"
    >
      {{ image.caption }}
    </figcaption>
  </figure>
</template>
