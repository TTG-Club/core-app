<script setup lang="ts">
  import type {
    HpAmountPayload,
    HpPatchPayload,
    InitiativeParticipant,
    InitiativeParticipantState,
  } from '../model';

  import ParticipantListItem from './ParticipantListItem.vue';

  defineProps<{
    participants: Array<InitiativeParticipant>;
    currentParticipantId?: string;
    readonly?: boolean;
  }>();

  const emit = defineEmits<{
    'damage': [participantId: string, payload: HpAmountPayload];
    'heal': [participantId: string, payload: HpAmountPayload];
    'temporary-hp': [participantId: string, payload: HpAmountPayload];
    'patch-hp': [participantId: string, payload: HpPatchPayload];
    'patch-state': [
      participantId: string,
      payload: { state: InitiativeParticipantState },
    ];
  }>();

  function forwardDamage(
    participantId: string,
    payload: HpAmountPayload,
  ): void {
    emit('damage', participantId, payload);
  }

  function forwardHeal(participantId: string, payload: HpAmountPayload): void {
    emit('heal', participantId, payload);
  }

  function forwardTemporaryHp(
    participantId: string,
    payload: HpAmountPayload,
  ): void {
    emit('temporary-hp', participantId, payload);
  }

  function forwardPatchHp(
    participantId: string,
    payload: HpPatchPayload,
  ): void {
    emit('patch-hp', participantId, payload);
  }

  function forwardPatchState(
    participantId: string,
    payload: { state: InitiativeParticipantState },
  ): void {
    emit('patch-state', participantId, payload);
  }
</script>

<template>
  <section class="grid gap-3">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-highlighted">Участники</h2>

      <UBadge
        variant="soft"
        color="neutral"
      >
        {{ participants.length }}
      </UBadge>
    </div>

    <ul
      v-if="participants.length"
      class="grid gap-3"
    >
      <ParticipantListItem
        v-for="participant in participants"
        :key="participant.id"
        :participant
        :active="participant.id === currentParticipantId"
        :readonly
        @damage="forwardDamage"
        @heal="forwardHeal"
        @temporary-hp="forwardTemporaryHp"
        @patch-hp="forwardPatchHp"
        @patch-state="forwardPatchState"
      />
    </ul>

    <UAlert
      v-else
      icon="tabler:user-plus"
      color="neutral"
      variant="soft"
      title="Список пуст"
      description="Добавьте персонажей и существ перед началом боя."
    />
  </section>
</template>
