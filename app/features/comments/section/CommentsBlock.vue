<script setup lang="ts">
  import { getCommentsTarget } from '../model';
  import CommentsSection from './CommentsSection.vue';

  const { path } = defineProps<{
    /**
     * Канонический путь (`/spells/fireball`) или абсолютный URL деталки —
     * общие обёртки (layout детальной страницы, дровер, широкая панель)
     * передают его как есть, не зная про комментарии.
     */
    path: string;
  }>();

  /**
   * Цель обсуждения; `null` — раздел без комментариев (мастерская, служебные
   * страницы), блок не рендерится вовсе.
   */
  const target = computed(() => getCommentsTarget(path));
</script>

<template>
  <!--
    Ключ по url: широкая панель не перемонтируется при смене сущности,
    а состояние ленты в composable привязано к треду с момента создания.
    Отступ сверху задан здесь, чтобы точки вставки не знали о блоке ничего,
    кроме пути.
  -->
  <CommentsSection
    v-if="target"
    :key="target.url"
    class="mt-6"
    :section="target.section"
    :url="target.url"
  />
</template>
