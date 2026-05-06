<script setup lang="ts">
  import type {
    HpAmountPayload,
    HpPatchPayload,
    InitiativeParticipant,
    InitiativeParticipantState,
  } from '../model';

  import {
    HP_CONTROL_DEFAULT_VALUE,
    PARTICIPANT_STATE_OPTIONS,
  } from '../model';

  const props = defineProps<{
    participant: InitiativeParticipant;
    readonly?: boolean;
    compact?: boolean;
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

  const amount = ref(HP_CONTROL_DEFAULT_VALUE);
  const hpMax = ref(props.participant.hpMax);
  const hpCurrent = ref(props.participant.hpCurrent);
  const hpTemporary = ref(props.participant.hpTemporary);
  const state = ref<InitiativeParticipantState>(props.participant.state);

  watch(
    () => props.participant,
    (participant) => {
      hpMax.value = participant.hpMax;
      hpCurrent.value = participant.hpCurrent;
      hpTemporary.value = participant.hpTemporary;
      state.value = participant.state;
    },
  );

  const isDisabled = computed(() => props.readonly);

  const rootClass = computed(() =>
    props.compact ? 'grid gap-2' : 'grid gap-3',
  );

  function emitDamage(): void {
    emit('damage', props.participant.id, { amount: amount.value });
  }

  function emitHeal(): void {
    emit('heal', props.participant.id, { amount: amount.value });
  }

  function emitTemporaryHp(): void {
    emit('temporary-hp', props.participant.id, { amount: amount.value });
  }

  function emitClearTemporaryHp(): void {
    emit('temporary-hp', props.participant.id, { amount: 0 });
  }

  function emitPatchHp(): void {
    emit('patch-hp', props.participant.id, {
      hpMax: hpMax.value,
      hpCurrent: hpCurrent.value,
      hpTemporary: hpTemporary.value,
    });
  }

  function emitPatchState(value: unknown): void {
    if (value !== 'ACTIVE' && value !== 'UNCONSCIOUS' && value !== 'DEAD') {
      return;
    }

    state.value = value;
    emit('patch-state', props.participant.id, { state: value });
  }
</script>

<template>
  <div :class="rootClass">
    <div
      class="grid grid-cols-[minmax(72px,1fr)_repeat(4,minmax(0,auto))] gap-2"
    >
      <UInputNumber
        v-model="amount"
        :min="0"
        :disabled="isDisabled"
        size="sm"
      />

      <UTooltip text="Урон">
        <UButton
          icon="tabler:sword"
          color="error"
          variant="soft"
          size="sm"
          :disabled="isDisabled"
          @click.left.exact.prevent="emitDamage"
        />
      </UTooltip>

      <UTooltip text="Лечение">
        <UButton
          icon="tabler:heart-plus"
          color="success"
          variant="soft"
          size="sm"
          :disabled="isDisabled"
          @click.left.exact.prevent="emitHeal"
        />
      </UTooltip>

      <UTooltip text="Временные хиты">
        <UButton
          icon="tabler:shield-plus"
          color="info"
          variant="soft"
          size="sm"
          :disabled="isDisabled"
          @click.left.exact.prevent="emitTemporaryHp"
        />
      </UTooltip>

      <UTooltip text="Очистить временные хиты">
        <UButton
          icon="tabler:shield-x"
          color="neutral"
          variant="soft"
          size="sm"
          :disabled="isDisabled"
          @click.left.exact.prevent="emitClearTemporaryHp"
        />
      </UTooltip>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <UFormField label="Макс.">
        <UInputNumber
          v-model="hpMax"
          :min="0"
          :disabled="isDisabled"
          size="sm"
        />
      </UFormField>

      <UFormField label="Текущие">
        <UInputNumber
          v-model="hpCurrent"
          :min="0"
          :disabled="isDisabled"
          size="sm"
        />
      </UFormField>

      <UFormField label="Врем.">
        <UInputNumber
          v-model="hpTemporary"
          :min="0"
          :disabled="isDisabled"
          size="sm"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <USelect
        :model-value="state"
        :items="PARTICIPANT_STATE_OPTIONS"
        :disabled="isDisabled"
        value-key="value"
        label-key="label"
        size="sm"
        @update:model-value="emitPatchState"
      />

      <UButton
        icon="tabler:device-floppy"
        variant="soft"
        color="neutral"
        size="sm"
        :disabled="isDisabled"
        @click.left.exact.prevent="emitPatchHp"
      />
    </div>
  </div>
</template>
