<script setup lang="ts">
  import UiVideoPlayer from './UiVideoPlayer.vue';

  /**
   * Окно просмотра ролика поверх страницы — открывается через `useOverlay`
   * (кнопка «Смотреть» на обложке карточки). Ролик стартует сразу.
   */
  const { url, title } = defineProps<{
    url: string;
    title: string;
  }>();

  defineEmits<{
    close: [];
  }>();
</script>

<template>
  <UModal
    :title
    :ui="{ content: 'sm:max-w-5xl', body: 'p-0 sm:p-0' }"
  >
    <template #body>
      <UiVideoPlayer
        :url
        :title
        autoplay
        class="rounded-none"
      />
    </template>
  </UModal>
</template>
