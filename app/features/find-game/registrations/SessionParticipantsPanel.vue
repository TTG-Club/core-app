<script setup lang="ts">
  import type { Game, GameSession, SessionParticipant } from '../model';

  import { UiResult } from '~ui/result';

  import { useParticipantNames } from '../composables';
  import {
    fetchSessionParticipants,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    getFindGameErrorMessage,
    PAYMENT_MARK_LABEL,
    PAYMENT_PAID_LABEL,
    PAYMENT_SAVED_TOAST,
    PAYMENT_UNMARK_LABEL,
    PAYMENT_UNPAID_LABEL,
    SESSION_ATTENDANCE_STATUS_LABELS,
    SESSION_PARTICIPANTS_COUNT_LABEL,
    SESSION_PARTICIPANTS_EMPTY_TITLE,
    SESSION_PARTICIPANTS_LABEL,
    updateParticipantPayment,
  } from '../model';

  /**
   * Состав сессии глазами мастера: кто придёт и кто заплатил.
   *
   * Принимать и отклонять здесь нечего — состав определяет заявка в игру, а у
   * встречи остаётся только то, что к ней относится.
   */
  const isOpen = defineModel<boolean>('open', { required: true });

  const { game, session } = defineProps<{
    game: Game;
    /** Сессия, чей состав смотрим; `null` — панель закрыта. */
    session: GameSession | null;
  }>();

  const emit = defineEmits<{
    changed: [];
  }>();

  const toast = useToast();
  const { getParticipantName, resolveNames } = useParticipantNames();

  // Пока панель закрыта, запрашивать нечего: состав подтягивается ровно на её
  // открытие.
  const requestedSessionId = computed(() =>
    isOpen.value && session ? session.id : null,
  );

  const {
    data: participants,
    refresh,
    status,
  } = useAsyncData(
    () => `find-game-participants-${requestedSessionId.value ?? 'none'}`,
    async () => {
      const sessionId = requestedSessionId.value;

      if (!sessionId) {
        return [];
      }

      return await fetchSessionParticipants(game.id, sessionId);
    },
    {
      watch: [requestedSessionId],
      deep: false,
      server: false,
      default: () => [],
    },
  );

  const isBusy = ref(false);

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  const isEmpty = computed(
    () => status.value === 'success' && !participants.value?.length,
  );

  const fillLabel = computed(
    () =>
      `${SESSION_PARTICIPANTS_COUNT_LABEL}: ${participants.value?.length ?? 0} / ${game.maxPlayers}`,
  );

  const showPayment = computed(() => game.costType === 'PAID');

  // Имена живут в core-api: сервис поиска игр знает только идентификаторы.
  watch(
    participants,
    (list) => {
      void resolveNames(
        (list ?? []).map((participant) => participant.playerId),
      );
    },
    { immediate: true },
  );

  /**
   * Отмечает или снимает оплату участника.
   * @param participant Участник сессии.
   */
  async function togglePaid(participant: SessionParticipant): Promise<void> {
    const sessionId = requestedSessionId.value;

    if (!sessionId) {
      return;
    }

    isBusy.value = true;

    try {
      await updateParticipantPayment(
        game.id,
        sessionId,
        participant.playerId,
        !participant.paid,
      );

      toast.add({
        title: PAYMENT_SAVED_TOAST,
        color: 'success',
        icon: 'tabler:check',
      });

      await refresh();
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
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="SESSION_PARTICIPANTS_LABEL"
    :description="session?.title"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <UBadge
          color="neutral"
          variant="subtle"
          size="sm"
          icon="tabler:users"
          :label="fillLabel"
        />

        <USkeleton
          v-if="isLoading"
          class="h-24 w-full rounded-md"
        />

        <UiResult
          v-else-if="isEmpty"
          status="info"
          :title="SESSION_PARTICIPANTS_EMPTY_TITLE"
        />

        <div
          v-else
          class="flex flex-col gap-2"
        >
          <div
            v-for="participant in participants"
            :key="participant.id"
            class="flex flex-col gap-2 rounded-md border border-default p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-highlighted">
                {{ getParticipantName(participant.playerId) }}
              </span>

              <div class="flex flex-wrap items-center gap-1.5">
                <UBadge
                  v-if="participant.attendanceStatus"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  :label="
                    SESSION_ATTENDANCE_STATUS_LABELS[
                      participant.attendanceStatus
                    ]
                  "
                />

                <UBadge
                  v-if="showPayment"
                  :color="participant.paid ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                  icon="tabler:receipt"
                  :label="
                    participant.paid ? PAYMENT_PAID_LABEL : PAYMENT_UNPAID_LABEL
                  "
                />
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                v-if="showPayment"
                size="sm"
                color="neutral"
                variant="subtle"
                icon="tabler:receipt"
                :disabled="isBusy"
                :label="
                  participant.paid ? PAYMENT_UNMARK_LABEL : PAYMENT_MARK_LABEL
                "
                @click.left.exact.prevent="togglePaid(participant)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>
