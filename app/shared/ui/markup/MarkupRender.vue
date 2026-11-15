<script setup lang="ts">
  import type { Group, RenderNode, RenderResult } from './types';

  import { computed } from 'vue';

  import {
    GROUP_SPACING,
    GROUP_SPACING_AFTER_SEPARATOR,
    GROUP_SPACING_BEFORE_SEPARATOR,
    GROUP_SPACING_SEPARATOR,
    IMAGE_FLOW_BLOCK_CLASSES,
    IMAGE_FLOW_WRAPPER_CLASS,
    SEPARATOR_BLOCK_TYPE,
  } from './consts';
  import { IMAGE_BLOCK_TYPE } from './image';
  import { MarkupPassthrough } from './passthrough';
  import { render, toBlockGroups } from './renderer';

  const { renderNode } = defineProps<{
    renderNode: RenderNode | RenderNode[];
  }>();

  /**
   * Вертикальная отбивка группы от соседей.
   *
   * Вокруг разделителя весь зазор задаёт он сам (паддингом), а margin'ы гасятся:
   * описание рисуется во флекс-колонке (ArticleBody и другие тела), где соседние
   * margin'ы НЕ схлопываются, и `mt-*` заголовка после линии делал зазор снизу
   * заметно шире, чем сверху.
   *
   * @param blockType - Тип блочного маркера самой группы
   * @param previousType - Тип блочного маркера предыдущей группы
   * @param nextType - Тип блочного маркера следующей группы
   * @returns Строка Tailwind-классов отбивки
   */
  function toSpacingClass(
    blockType: string | undefined,
    previousType: string | undefined,
    nextType: string | undefined,
  ): string {
    if (blockType === SEPARATOR_BLOCK_TYPE) {
      return GROUP_SPACING_SEPARATOR;
    }

    if (previousType === SEPARATOR_BLOCK_TYPE) {
      return GROUP_SPACING_AFTER_SEPARATOR;
    }

    if (nextType === SEPARATOR_BLOCK_TYPE) {
      return GROUP_SPACING_BEFORE_SEPARATOR;
    }

    return GROUP_SPACING;
  }

  const rendered = computed<RenderResult>(() => {
    try {
      // Одиночный элемент (строка «{@...}»-разметки, MarkerNode или SimpleTextNode).
      if (!Array.isArray(renderNode)) {
        return {
          isSingle: true,
          vnodes: render(renderNode),
        };
      }

      // Каждый элемент описания разбиваем на блочные/инлайновые группы, чтобы
      // блочные маркеры ({@h}/{@list}/{@quote}/…) рисовались вне <p>, а не внутри.
      const blockGroups = renderNode.flatMap((entry) => toBlockGroups(entry));

      // Картинкам нужен блочный поток (см. IMAGE_FLOW_WRAPPER_CLASS). Описание
      // без картинок рисуется прямо в контейнере родителя, без обёртки.
      const hasImage = blockGroups.some(
        (group) => group.blockType === IMAGE_BLOCK_TYPE,
      );

      const groups: Group[] = blockGroups.map((group, index) => {
        const spacingClass = toSpacingClass(
          group.blockType,
          blockGroups[index - 1]?.blockType,
          blockGroups[index + 1]?.blockType,
        );

        const flowClass =
          hasImage && group.blockType
            ? IMAGE_FLOW_BLOCK_CLASSES[group.blockType]
            : undefined;

        return {
          id: index,
          ...group,
          spacingClass: flowClass
            ? `${spacingClass} ${flowClass}`
            : spacingClass,
        };
      });

      return {
        isSingle: false,
        hasImage,
        groups,
      };
    } catch (e) {
      consola.error('[Markup] Error rendering entries:', e);

      return { isSingle: true, vnodes: [] };
    }
  });

  // Обёртка появляется только у описания с картинками: остальным страницам
  // лишний `div` поменял бы отступы между блоками (во флекс-колонке родителя
  // margin'ы соседей не схлопываются, в блочном потоке — схлопываются).
  const groupsWrapper = computed(() =>
    rendered.value.hasImage ? 'div' : MarkupPassthrough,
  );

  const groupsWrapperClass = computed(() =>
    rendered.value.hasImage ? IMAGE_FLOW_WRAPPER_CLASS : undefined,
  );
</script>

<template>
  <ClientOnly>
    <template v-if="rendered.isSingle">
      <component
        :is="vnode"
        v-for="(vnode, index) in rendered.vnodes"
        :key="index"
      />
    </template>

    <component
      :is="groupsWrapper"
      v-else
      :class="groupsWrapperClass"
    >
      <template
        v-for="group in rendered.groups"
        :key="group.id"
      >
        <template v-if="group.isBlock">
          <component
            :is="vnode"
            v-for="(vnode, index) in group.vnodes"
            :key="index"
            :class="group.spacingClass"
          />
        </template>

        <p
          v-else
          :class="group.spacingClass"
        >
          <component
            :is="vnode"
            v-for="(vnode, index) in group.vnodes"
            :key="index"
          />
        </p>
      </template>
    </component>
  </ClientOnly>
</template>
