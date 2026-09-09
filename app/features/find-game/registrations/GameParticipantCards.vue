<script setup lang="ts">
  import type {
    Game,
    GameRegistration,
    SessionAttendanceStatus,
  } from '../model';

  import { useParticipantNames } from '../composables';
  import {
    APPLY_WITHDRAW_LABEL,
    ATTENDANCE_SAVED_TOAST,
    CANCEL_LABEL,
    claimSessionPayment,
    fetchGameParticipants,
    fetchOwnGameFinance,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_FINANCE_BALANCE,
    GAME_FINANCE_CLAIM,
    GAME_FINANCE_PAY,
    GAME_LEAVE_DESCRIPTION,
    GAME_LEAVE_LABEL,
    GAME_NEAREST_SESSION_LABEL,
    GAME_NO_PLANNED_SESSION_LABEL,
    GAME_OWN_CARD_LABEL,
    GAME_PARTICIPANTS_ERROR_TITLE,
    GAME_PARTICIPANTS_PRIVATE_HINT,
    GAME_PARTICIPANTS_REFRESH_LABEL,
    getFindGameErrorMessage,
    getNextSessionLabel,
    paySessionFromBalance,
    SESSION_ATTENDANCE_COLORS,
    SESSION_ATTENDANCE_ICONS,
    SESSION_ATTENDANCE_STATUS_LABELS,
    SESSION_ATTENDANCE_STATUSES,
    SESSION_REGISTRATION_STATUS_LABELS,
  } from '../model';

  const {
    gameId,
    game,
    ownRegistration,
    busy = false,
    changeAttendance,
  } = defineProps<{
    gameId: string;
    game: Game;
    ownRegistration: GameRegistration | null;
    busy?: boolean;
    changeAttendance: (
      sessionId: string,
      attendanceStatus: SessionAttendanceStatus,
    ) => Promise<void>;
  }>();

  const emit = defineEmits<{ withdraw: [] }>();
  const { getParticipantName, resolveNames } = useParticipantNames();
  const isApproved = computed(() => ownRegistration?.status === 'APPROVED');

  const canWithdraw = computed(
    () => isApproved.value || ownRegistration?.status === 'PENDING',
  );

  const withdrawalLabel = computed(() =>
    isApproved.value ? GAME_LEAVE_LABEL : APPLY_WITHDRAW_LABEL,
  );

  const isLeaveOpen = ref(false);

  const {
    data: participants,
    error,
    status,
    refresh,
  } = useAsyncData(
    () =>
      `find-game-participants-${gameId}-${ownRegistration?.id ?? 'none'}-${ownRegistration?.status ?? 'none'}`,
    () =>
      isApproved.value ? fetchGameParticipants(gameId) : Promise.resolve([]),
    { server: false, deep: false, default: () => [] },
  );

  const otherParticipants = computed(() =>
    participants.value.filter(
      (participant) => participant.playerId !== ownRegistration?.playerId,
    ),
  );

  const toast = useToast();

  const { data: ownFinance, refresh: refreshFinance } = useAsyncData(
    () => `find-game-own-finance-${gameId}`,
    () =>
      game.costType === 'PAID' && isApproved.value
        ? fetchOwnGameFinance(gameId)
        : Promise.resolve({ accounts: [] }),
    { server: false, default: () => ({ accounts: [] }) },
  );

  const isSavingAttendance = ref(false);

  const ownSession = computed(
    () =>
      participants.value.find(
        (participant) => participant.playerId === ownRegistration?.playerId,
      )?.nextSession ?? null,
  );

  const nearestSession = computed(
    () => participants.value[0]?.nextSession ?? null,
  );

  const nearestSessionLabel = computed(() =>
    nearestSession.value
      ? `${GAME_NEAREST_SESSION_LABEL}: ${getNextSessionLabel(nearestSession.value)}`
      : GAME_NO_PLANNED_SESSION_LABEL,
  );

  const ownAccount = computed(() => ownFinance.value.accounts[0] ?? null);

  const ownBill = computed(
    () =>
      ownAccount.value?.bills.find(
        (bill) => bill.sessionId === ownSession.value?.id,
      ) ?? null,
  );

  /** Форматирует баланс по конкретной валюте, не объединяя разные деньги. */
  function formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /** Резервирует оплату ближайшей сессии из внесённого депозита. */
  async function payFromBalance(): Promise<void> {
    if (!ownSession.value) {
      return;
    }

    isSavingAttendance.value = true;

    try {
      await paySessionFromBalance(gameId, ownSession.value.id);
      await refreshFinance();
      await refresh();
    } catch (requestError) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(requestError),
        color: 'error',
      });
    } finally {
      isSavingAttendance.value = false;
    }
  }

  /** Сообщает мастеру о переводе, когда депозита недостаточно. */
  async function claimPayment(): Promise<void> {
    if (!ownSession.value) {
      return;
    }

    isSavingAttendance.value = true;

    try {
      await claimSessionPayment(gameId, ownSession.value.id);
      await refreshFinance();
    } catch (requestError) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(requestError),
        color: 'error',
      });
    } finally {
      isSavingAttendance.value = false;
    }
  }

  const attendanceOptions = computed(() =>
    SESSION_ATTENDANCE_STATUSES.map((attendanceStatus) => ({
      value: attendanceStatus,
      label: SESSION_ATTENDANCE_STATUS_LABELS[attendanceStatus],
      icon: SESSION_ATTENDANCE_ICONS[attendanceStatus],
      selected: ownSession.value?.attendanceStatus === attendanceStatus,
      color: SESSION_ATTENDANCE_COLORS[attendanceStatus],
    })),
  );

  /** Сохраняет отметку именно для показанной встречи, не подменяя её следующей. */
  async function saveAttendance(
    attendanceStatus: SessionAttendanceStatus,
  ): Promise<void> {
    const session = ownSession.value;

    if (
      !session
      || isSavingAttendance.value
      || session.attendanceStatus === attendanceStatus
    ) {
      return;
    }

    isSavingAttendance.value = true;

    try {
      await changeAttendance(session.id, attendanceStatus);
      await refresh();
      toast.add({ title: ATTENDANCE_SAVED_TOAST, color: 'success' });
    } catch (requestError) {
      toast.add({
        title: FIND_GAME_UNKNOWN_ERROR_MESSAGE,
        description: getFindGameErrorMessage(requestError),
        color: 'error',
      });

      await refresh();
    } finally {
      isSavingAttendance.value = false;
    }
  }

  watch(
    [participants, () => ownRegistration],
    () => {
      const playerIds = participants.value.map(
        (participant) => participant.playerId,
      );

      if (ownRegistration) {
        playerIds.push(ownRegistration.playerId);
      }

      void resolveNames(playerIds);
    },
    { immediate: true },
  );

  /** Подтверждает выход из состава; неразобранную заявку отзывает сразу. */
  function requestWithdrawal(): void {
    if (isApproved.value) {
      isLeaveOpen.value = true;
    } else {
      emit('withdraw');
    }
  }

  /** Передаёт подтверждённый выход родителю. */
  function confirmLeave(): void {
    isLeaveOpen.value = false;
    emit('withdraw');
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <UAlert
      v-if="error"
      color="error"
      :title="GAME_PARTICIPANTS_ERROR_TITLE"
      :description="getFindGameErrorMessage(error)"
    />

    <div
      v-if="isApproved"
      class="flex flex-wrap items-center justify-between gap-2"
    >
      <p
        v-if="status === 'success'"
        class="text-sm text-muted"
      >
        {{ nearestSessionLabel }}
      </p>

      <UButton
        size="sm"
        variant="ghost"
        color="neutral"
        icon="tabler:refresh"
        :label="GAME_PARTICIPANTS_REFRESH_LABEL"
        :loading="status === 'pending'"
        @click.left.exact.prevent="refresh()"
      />
    </div>

    <div class="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-if="ownRegistration"
        class="flex min-w-0 flex-col gap-3 rounded-md border border-primary/40 bg-elevated/30 p-3 text-sm"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-medium wrap-break-word text-highlighted">
              {{ getParticipantName(ownRegistration.playerId) }}
            </p>

            <p
              v-if="ownRegistration.characterName"
              class="wrap-break-word text-muted"
            >
              {{ ownRegistration.characterName }}
            </p>
          </div>

          <UBadge
            :label="GAME_OWN_CARD_LABEL"
            variant="subtle"
          />
        </div>

        <UBadge
          class="self-start"
          :label="SESSION_REGISTRATION_STATUS_LABELS[ownRegistration.status]"
          color="neutral"
          variant="subtle"
        />

        <UButton
          v-if="canWithdraw"
          class="self-start"
          size="sm"
          color="error"
          variant="subtle"
          icon="tabler:logout"
          :label="withdrawalLabel"
          :loading="busy"
          @click.left.exact.prevent="requestWithdrawal"
        />

        <div
          v-if="ownSession"
          class="flex flex-wrap gap-2"
        >
          <UBadge
            class="w-full"
            variant="subtle"
            :label="
              SESSION_ATTENDANCE_STATUS_LABELS[ownSession.attendanceStatus]
            "
            :color="SESSION_ATTENDANCE_COLORS[ownSession.attendanceStatus]"
          />

          <UButton
            v-for="option in attendanceOptions"
            :key="option.value"
            size="sm"
            :label="option.label"
            :icon="option.icon"
            :color="option.color"
            :aria-pressed="option.selected"
            :disabled="isSavingAttendance || busy || option.selected"
            variant="subtle"
            @click.left.exact.prevent="saveAttendance(option.value)"
          />

          <div
            v-if="game.costType === 'PAID'"
            class="flex w-full flex-wrap gap-2 border-t border-default pt-2"
          >
            <UBadge
              v-for="(balance, currency) in ownAccount?.balances"
              :key="currency"
              color="neutral"
              variant="subtle"
              :label="`${GAME_FINANCE_BALANCE}: ${formatMoney(balance, currency)}`"
            />

            <UButton
              v-if="!ownBill || ownBill.remaining > 0"
              size="sm"
              color="primary"
              variant="subtle"
              icon="tabler:wallet"
              :label="GAME_FINANCE_PAY"
              :loading="isSavingAttendance"
              @click.left.exact.prevent="payFromBalance"
            />

            <UButton
              v-if="
                !ownBill || (ownBill.remaining > 0 && ownBill.claimed === 0)
              "
              size="sm"
              color="neutral"
              variant="subtle"
              icon="tabler:receipt"
              :label="GAME_FINANCE_CLAIM"
              :loading="isSavingAttendance"
              @click.left.exact.prevent="claimPayment"
            />
          </div>
        </div>
      </div>

      <div
        v-for="participant in otherParticipants"
        :key="participant.playerId"
        class="flex min-w-0 items-start gap-3 rounded-md border border-default bg-elevated/30 p-3 text-sm"
      >
        <UIcon
          name="tabler:user"
          class="size-5 shrink-0 text-muted"
        />

        <div class="min-w-0">
          <p class="font-medium wrap-break-word text-highlighted">
            {{ getParticipantName(participant.playerId) }}
          </p>

          <p
            v-if="participant.characterName"
            class="wrap-break-word text-muted"
          >
            {{ participant.characterName }}
          </p>

          <UBadge
            v-if="participant.nextSession"
            class="mt-2"
            variant="subtle"
            :label="
              SESSION_ATTENDANCE_STATUS_LABELS[
                participant.nextSession.attendanceStatus
              ]
            "
            :color="
              SESSION_ATTENDANCE_COLORS[
                participant.nextSession.attendanceStatus
              ]
            "
            :icon="
              SESSION_ATTENDANCE_ICONS[participant.nextSession.attendanceStatus]
            "
          />
        </div>
      </div>

      <USkeleton
        v-if="isApproved && status === 'pending'"
        class="h-24 rounded-md"
      />
    </div>

    <p
      v-if="!isApproved"
      class="text-sm text-muted"
    >
      {{ GAME_PARTICIPANTS_PRIVATE_HINT }}
    </p>
  </div>

  <UModal
    v-model:open="isLeaveOpen"
    :title="GAME_LEAVE_LABEL"
    :description="GAME_LEAVE_DESCRIPTION"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :label="CANCEL_LABEL"
          @click.left.exact.prevent="isLeaveOpen = false"
        />

        <UButton
          color="error"
          :label="GAME_LEAVE_LABEL"
          :loading="busy"
          @click.left.exact.prevent="confirmLeave"
        />
      </div>
    </template>
  </UModal>
</template>
