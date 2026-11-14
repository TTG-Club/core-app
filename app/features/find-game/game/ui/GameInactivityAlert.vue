<script setup lang="ts">
  import {
    GAME_INACTIVITY_DESCRIPTION_PREFIX,
    GAME_INACTIVITY_DESCRIPTION_SUFFIX,
    GAME_INACTIVITY_TITLE,
    GAME_KEEP_ACTIVE_LABEL,
  } from '../../model';

  const { autoCancelAt, busy } = defineProps<{
    /** Когда игра отменится без ответа мастера. */
    autoCancelAt: string;
    busy: boolean;
  }>();

  const emit = defineEmits<{
    'keep-active': [];
  }>();

  const { format } = useDayjs();

  const description = computed(
    () =>
      `${GAME_INACTIVITY_DESCRIPTION_PREFIX} ${format(autoCancelAt, 'LLL')}. ${GAME_INACTIVITY_DESCRIPTION_SUFFIX}`,
  );

  /** Сообщает странице, что мастер подтвердил актуальность игры. */
  function handleKeepActive(): void {
    emit('keep-active');
  }
</script>

<!--
  Вопрос мастеру о брошенной игре. Стоит над обоими столбцами страницы:
  мастер должен увидеть его сразу, как откроет игру из уведомления или письма.
-->
<template>
  <UAlert
    color="warning"
    variant="subtle"
    icon="tabler:hourglass"
    :title="GAME_INACTIVITY_TITLE"
    :description="description"
  >
    <template #actions>
      <UButton
        color="warning"
        variant="solid"
        size="sm"
        icon="tabler:check"
        :loading="busy"
        :label="GAME_KEEP_ACTIVE_LABEL"
        @click.left.exact.prevent="handleKeepActive"
      />
    </template>
  </UAlert>
</template>
