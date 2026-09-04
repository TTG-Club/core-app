<script setup lang="ts">
  import type { Game, GameRegistration } from '../model';

  import { UiResult } from '~ui/result';

  import { useGameRegistrations, useParticipantNames } from '../composables';
  import {
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_APPROVED_PLAYERS_LABEL,
    getFindGameErrorMessage,
    REGISTRATION_REVIEWED_TOAST,
    REGISTRATIONS_EMPTY_TITLE,
    SESSION_REGISTRATIONS_LABEL,
  } from '../model';
  import { RegistrationRejectModal, RegistrationRow } from './ui';

  const isOpen = defineModel<boolean>('open', { required: true });

  const { game } = defineProps<{
    game: Game;
  }>();

  const emit = defineEmits<{
    changed: [];
  }>();

  const toast = useToast();
  const { getParticipantName, resolveNames } = useParticipantNames();

  const rejectTarget = ref<GameRegistration | null>(null);

  const isRejectOpen = computed({
    get: () => !!rejectTarget.value,
    set: (opened: boolean) => {
      if (!opened) {
        rejectTarget.value = null;
      }
    },
  });

  // Пока панель закрыта, запрашивать нечего: заявки подтягиваются ровно на
  // её открытие.
  const requestedGameId = computed(() => (isOpen.value ? game.id : null));

  const { approvedRegistrations, isLoading, registrations, review, status } =
    useGameRegistrations(requestedGameId);

  const isBusy = ref(false);

  const isFull = computed(
    () => approvedRegistrations.value.length >= game.maxPlayers,
  );

  const fillLabel = computed(
    () =>
      `${GAME_APPROVED_PLAYERS_LABEL}: ${approvedRegistrations.value.length} / ${game.maxPlayers}`,
  );

  const isEmpty = computed(
    () => status.value === 'success' && !registrations.value.length,
  );

  // Заявки приходят с идентификаторами игроков, а показать нужно имена: их
  // владелец — core-api.
  watch(
    registrations,
    (list) => {
      resolveNames(list.map((registration) => registration.playerId));
    },
    { immediate: true },
  );

  /**
   * Выполняет действие мастера, показывая результат уведомлением.
   * @param action Сам запрос к сервису.
   */
  async function runMasterAction(action: () => Promise<void>): Promise<void> {
    isBusy.value = true;

    try {
      await action();

      toast.add({
        title: REGISTRATION_REVIEWED_TOAST,
        color: 'success',
        icon: 'tabler:check',
      });

      emit('changed');
    } catch (error) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });
    } finally {
      isBusy.value = false;
    }
  }

  /**
   * Принимает заявку.
   * @param registrationId Идентификатор заявки.
   */
  function approve(registrationId: string): void {
    runMasterAction(() => review(registrationId, 'APPROVE'));
  }

  /**
   * Спрашивает причину отказа.
   * @param registrationId Идентификатор заявки.
   */
  function askReject(registrationId: string): void {
    rejectTarget.value =
      registrations.value.find(
        (registration) => registration.id === registrationId,
      ) ?? null;
  }

  /**
   * Отклоняет заявку с названной причиной.
   * @param registrationId Идентификатор заявки.
   * @param reason Причина отказа; пустая означает «без объяснений».
   */
  async function reject(registrationId: string, reason: string): Promise<void> {
    await runMasterAction(() => review(registrationId, 'REJECT', reason));

    rejectTarget.value = null;
  }
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="SESSION_REGISTRATIONS_LABEL"
    :description="game.title"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <UBadge
          :color="isFull ? 'warning' : 'neutral'"
          variant="subtle"
          size="sm"
          icon="tabler:users"
          class="self-start"
          :label="fillLabel"
        />

        <div
          v-if="isLoading"
          class="flex flex-col gap-2"
        >
          <USkeleton
            v-for="index in 3"
            :key="index"
            class="h-24 w-full rounded-md"
          />
        </div>

        <UiResult
          v-else-if="isEmpty"
          status="info"
          :title="REGISTRATIONS_EMPTY_TITLE"
        />

        <div
          v-else
          class="flex flex-col gap-2"
        >
          <RegistrationRow
            v-for="registration in registrations"
            :key="registration.id"
            :registration="registration"
            :player-name="getParticipantName(registration.playerId)"
            :is-full="isFull"
            :busy="isBusy"
            @approve="approve"
            @reject="askReject"
          />
        </div>
      </div>
    </template>
  </USlideover>

  <RegistrationRejectModal
    v-model:open="isRejectOpen"
    :registration="rejectTarget"
    :player-name="getParticipantName(rejectTarget?.playerId ?? '')"
    :loading="isBusy"
    @submit="reject"
  />
</template>
