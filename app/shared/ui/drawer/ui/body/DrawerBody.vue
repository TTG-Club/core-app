<script setup lang="ts">
  import { CommentsBlock } from '~comments/section';
  import { UiResult } from '~ui/result';

  defineProps<{
    isLoading?: boolean;
    isError?: boolean;
    /**
     * Канонический путь или абсолютный URL открытой сущности — под её телом
     * появится блок комментариев. Блок сам решает по пути, включены ли
     * комментарии в разделе; без значения (превью, служебные дроверы)
     * не рендерится вовсе.
     */
    commentsPath?: string | null;
  }>();
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
