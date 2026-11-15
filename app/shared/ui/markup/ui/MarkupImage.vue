<script setup lang="ts">
  import type { VNode } from 'vue';

  import type { MarkerNode, RenderNode } from '../types';

  import { computed } from 'vue';

  import { UiGallery } from '~ui/gallery';

  import { IMAGE_FLOAT_CLASSES, IMAGE_WIDTH_VARIABLE } from '../consts';
  import { getImageWidth, readImageAttributes } from '../image';

  // `renderNodes` приходит всем компонентам маркеров (см. renderer.ts); картинке
  // он не нужен — вложенной разметки у неё нет.
  const { node } = defineProps<{
    node: MarkerNode;
    renderNodes: (nodes: RenderNode[]) => VNode[];
  }>();

  // Без адреса (или с небезопасным адресом) рисовать нечего: блок пропускается,
  // остальной текст остаётся на месте.
  const image = computed(() => readImageAttributes(node.attrs));

  // Обтекание и ширина включаются только в широкой колонке (контейнерный запрос
  // к обёртке MarkupRender). В узкой — телефон, дровер, карточка в списке —
  // картинка встаёт на всю ширину, иначе рядом с ней осталась бы полоска текста
  // в три слова.
  const figureClass = computed(() =>
    image.value?.float
      ? IMAGE_FLOAT_CLASSES[image.value.float]
      : IMAGE_FLOAT_CLASSES.none,
  );

  // Описание для тех, кто не видит картинку; не задано — берётся подпись.
  const alternativeText = computed(
    () => image.value?.alt ?? image.value?.caption,
  );

  const figureStyle = computed(() =>
    image.value
      ? { [IMAGE_WIDTH_VARIABLE]: `${getImageWidth(image.value)}%` }
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
