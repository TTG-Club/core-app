<script setup lang="ts">
  import type { GameRegistration } from '../model';

  import { useParticipantNames } from '../composables';
  import {
    APPLY_WITHDRAW_LABEL,
    CANCEL_LABEL,
    fetchGameParticipants,
    FIND_GAME_UNKNOWN_ERROR_MESSAGE,
    GAME_LEAVE_DESCRIPTION,
    GAME_LEAVE_LABEL,
    GAME_OWN_CARD_LABEL,
    GAME_PARTICIPANTS_PRIVATE_HINT,
    getFindGameErrorMessage,
    SESSION_REGISTRATION_STATUS_LABELS,
  } from '../model';

  const {
    gameId,
    ownRegistration,
    busy = false,
  } = defineProps<{
    gameId: string;
    ownRegistration: GameRegistration | null;
    busy?: boolean;
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
      :title="FIND_GAME_UNKNOWN_ERROR_MESSAGE"
      :description="getFindGameErrorMessage(error)"
    />

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
