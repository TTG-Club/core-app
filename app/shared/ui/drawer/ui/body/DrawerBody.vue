<script setup lang="ts">
  import { CommentsBlock } from '~comments/section';
  import { UiResult } from '~ui/result';

  const { commentsPath = undefined, entityPath = undefined } = defineProps<{
    isLoading?: boolean;
    isError?: boolean;
    /**
     * Канонический путь или абсолютный URL открытой сущности — под её телом
     * появится блок комментариев. Блок сам решает по пути, включены ли
     * комментарии в разделе; без значения (превью, служебные дроверы)
     * не рендерится вовсе.
     */
    commentsPath?: string | null;

    /**
     * Относительный путь открытой сущности для баг-репорта. Публикация висит
     * на теле дровера, а не на `UiDrawer`: тело монтируется вместе с
     * содержимым и размонтируется при закрытии, поэтому путь снимается сам.
     */
    entityPath?: string;
  }>();

  usePublishOpenEntityPath(() => entityPath);
</script>

<template>
  <template v-if="isLoading">
    <USkeleton
      v-for="index in 3"
      :key="index"
      :class="`w-1/${index + 1} h-6`"
    />
  </template>

  <UiResult
    v-else-if="isError"
    title="Неизвестная ошибка"
    status="error"
  />

  <template v-else>
    <slot name="default" />

    <CommentsBlock
      v-if="commentsPath"
      :path="commentsPath"
    />
  </template>
</template>
