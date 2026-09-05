<script setup lang="ts">
  import type { GameViewerAbilities } from '../../model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import {
    GAME_CANCEL_CONFIRM_DESCRIPTION,
    GAME_CANCEL_CONFIRM_TITLE,
    GAME_CANCEL_LABEL,
    GAME_CLOSE_CONFIRM_DESCRIPTION,
    GAME_CLOSE_CONFIRM_TITLE,
    GAME_CLOSE_LABEL,
    GAME_DELETE_LABEL,
    GAME_EDIT_LABEL,
    GAME_RAISE_LABEL,
    GAME_RECRUITMENT_CLOSE_LABEL,
    GAME_RECRUITMENT_OPEN_LABEL,
    GAMES_EDIT_ROUTE_SUFFIX,
    GAMES_ROUTE,
  } from '../../model';
  import GameDeleteModal from './GameDeleteModal.vue';

  const {
    abilities,
    gameId,
    busy = false,
  } = defineProps<{
    abilities: GameViewerAbilities;
    gameId: string;
    /** Идёт действие — кнопки блокируются, чтобы не отправить его дважды. */
    busy?: boolean;
  }>();

  const editRoute = computed(
    () => `${GAMES_ROUTE}/${gameId}/${GAMES_EDIT_ROUTE_SUFFIX}`,
  );

  const emit = defineEmits<{
    'cancel': [];
    'close': [];
    'close-recruitment': [];
    'open-recruitment': [];
    'raise': [];
    'remove': [reason: string];
  }>();

  const isCloseConfirmOpen = ref(false);
  const isCancelConfirmOpen = ref(false);
  const isDeleteOpen = ref(false);

  /** Открывает подтверждение завершения игры. */
  function askToClose(): void {
    isCloseConfirmOpen.value = true;
  }

  /** Подтверждено завершение игры. */
  function confirmClose(): void {
    isCloseConfirmOpen.value = false;
    emit('close');
  }

  /** Открывает подтверждение отмены игры. */
  function askToCancel(): void {
    isCancelConfirmOpen.value = true;
  }

  /** Подтверждена отмена игры. */
  function confirmCancel(): void {
    isCancelConfirmOpen.value = false;
    emit('cancel');
  }

  /** Открывает окно скрытия игры. */
  function askToDelete(): void {
    isDeleteOpen.value = true;
  }

  /**
   * Подтверждено скрытие игры.
   * @param reason Причина для административного аудита.
   */
  function confirmDelete(reason: string): void {
    isDeleteOpen.value = false;
    emit('remove', reason);
  }
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <!--
      Только иконки: действий немного, а подписи занимали всю строку заголовка.
      Название каждого остаётся доступным — в тултипе и как `aria-label`.
    -->
    <UTooltip
      v-if="abilities.canEditGame"
      :text="GAME_EDIT_LABEL"
    >
      <UButton
        :to="editRoute"
        color="neutral"
        variant="ghost"
        icon="tabler:pencil"
        :aria-label="GAME_EDIT_LABEL"
      />
    </UTooltip>

    <!-- Набор закрывают, когда группа собрана: объявление уходит из
      поиска, а у мастера и принятых игра остаётся -->
    <UTooltip
      v-if="abilities.canCloseRecruitment"
      :text="GAME_RECRUITMENT_CLOSE_LABEL"
    >
      <UButton
        color="neutral"
        variant="ghost"
        icon="tabler:user-off"
        :disabled="busy"
        :aria-label="GAME_RECRUITMENT_CLOSE_LABEL"
        @click.left.exact.prevent="emit('close-recruitment')"
      />
    </UTooltip>

    <UTooltip
      v-if="abilities.canOpenRecruitment"
      :text="GAME_RECRUITMENT_OPEN_LABEL"
    >
      <UButton
        color="neutral"
        variant="ghost"
        icon="tabler:user-plus"
        :disabled="busy"
        :aria-label="GAME_RECRUITMENT_OPEN_LABEL"
        @click.left.exact.prevent="emit('open-recruitment')"
      />
    </UTooltip>

    <UTooltip
      v-if="abilities.canRaiseGame"
      :text="GAME_RAISE_LABEL"
    >
      <UButton
        color="neutral"
        variant="ghost"
        icon="tabler:arrow-big-up-line"
        :disabled="busy"
        :aria-label="GAME_RAISE_LABEL"
        @click.left.exact.prevent="emit('raise')"
      />
    </UTooltip>

    <UTooltip
      v-if="abilities.canCloseGame"
      :text="GAME_CLOSE_LABEL"
    >
      <UButton
        color="neutral"
        variant="ghost"
        icon="tabler:flag-check"
        :disabled="busy"
        :aria-label="GAME_CLOSE_LABEL"
        @click.left.exact.prevent="askToClose"
      />
    </UTooltip>

    <UTooltip
      v-if="abilities.canCancelGame"
      :text="GAME_CANCEL_LABEL"
    >
      <UButton
        color="neutral"
        variant="ghost"
        icon="tabler:calendar-x"
        :disabled="busy"
        :aria-label="GAME_CANCEL_LABEL"
        @click.left.exact.prevent="askToCancel"
      />
    </UTooltip>

    <UTooltip
      v-if="abilities.canDeleteGame"
      :text="GAME_DELETE_LABEL"
    >
      <UButton
        color="error"
        variant="ghost"
        icon="tabler:eye-off"
        :disabled="busy"
        :aria-label="GAME_DELETE_LABEL"
        @click.left.exact.prevent="askToDelete"
      />
    </UTooltip>

    <ConfirmDialog
      v-model:open="isCloseConfirmOpen"
      :title="GAME_CLOSE_CONFIRM_TITLE"
      :description="GAME_CLOSE_CONFIRM_DESCRIPTION"
      :confirm-label="GAME_CLOSE_LABEL"
      confirm-color="warning"
      confirm-icon="tabler:flag-check"
      :loading="busy"
      @confirm="confirmClose"
    />

    <ConfirmDialog
      v-model:open="isCancelConfirmOpen"
      :title="GAME_CANCEL_CONFIRM_TITLE"
      :description="GAME_CANCEL_CONFIRM_DESCRIPTION"
      :confirm-label="GAME_CANCEL_LABEL"
      confirm-color="error"
      confirm-icon="tabler:calendar-x"
      :loading="busy"
      @confirm="confirmCancel"
    />

    <GameDeleteModal
      v-model:open="isDeleteOpen"
      :loading="busy"
      @confirm="confirmDelete"
    />
  </div>
</template>
