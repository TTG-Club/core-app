<script setup lang="ts">
  import { useParticipantNames } from '../composables';

  /**
   * Имя участника игры по идентификатору. Пока core-api не ответил, на месте
   * имени скелетон: подпись-заглушка выглядела бы как настоящее имя. Ответ без
   * имени — нейтральная подпись. Резолв компонент запускает сам, поэтому имя
   * найдётся и там, где родитель не резолвит список участников.
   */
  const { userId } = defineProps<{
    /** Идентификатор участника (клейм `sub`). */
    userId: string;
  }>();

  const {
    getParticipantName,
    isParticipantNamePending,
    watchParticipantNames,
  } = useParticipantNames();

  watchParticipantNames(() => [userId]);
</script>

<template>
  <USkeleton
    v-if="isParticipantNamePending(userId)"
    as="span"
    class="inline-block h-4 w-24 max-w-full align-middle"
  />

  <template v-else>
    {{ getParticipantName(userId) }}
  </template>
</template>
