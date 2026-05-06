<script setup lang="ts">
  import type {
    HpAmountPayload,
    HpPatchPayload,
    InitiativeParticipant,
    InitiativeParticipantState,
  } from '../model';

  import {
    PARTICIPANT_STATE_ICONS,
    PARTICIPANT_STATE_LABELS,
    RELATION_TYPE_ICONS,
    RELATION_TYPE_LABELS,
  } from '../model';
  import HpControls from './HpControls.vue';

  const props = defineProps<{
    participant: InitiativeParticipant;
    active?: boolean;
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

  const itemClass = computed(() => {
    const classes = [
      'rounded-lg border p-3 transition-colors',
      props.active
        ? 'border-primary bg-primary/10'
        : 'border-default bg-default',
    ];

    if (props.participant.state === 'DEAD') {
      classes.push('opacity-60');
    }

    return classes.join(' ');
  });

  const hpLabel = computed(() => {
    const temporary =
      props.participant.hpTemporary > 0
        ? ` +${props.participant.hpTemporary}`
        : '';

    return `${props.participant.hpCurrent} / ${props.participant.hpMax}${temporary}`;
  });

  const rollLabel = computed(() => {
    if (!props.participant.rolls.length) {
      return 'без броска';
    }

    return props.participant.rolls
      .map((roll) => (roll.discarded ? `(${roll.value})` : String(roll.value)))
      .join(', ');
  });

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
  <li :class="itemClass">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <UIcon
            :name="RELATION_TYPE_ICONS[participant.relationType]"
            class="size-5 shrink-0 text-muted"
          />

          <h3 class="truncate text-base font-semibold text-highlighted">
            {{ participant.name }}
          </h3>

          <UTooltip
            v-if="participant.state === 'DEAD'"
            :text="PARTICIPANT_STATE_LABELS.DEAD"
          >
            <UIcon
              :name="PARTICIPANT_STATE_ICONS.DEAD"
              class="size-5 shrink-0 text-error"
            />
          </UTooltip>
        </div>

        <div class="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
          <UBadge
            variant="soft"
            color="neutral"
          >
            {{ RELATION_TYPE_LABELS[participant.relationType] }}
          </UBadge>

          <UBadge
            variant="soft"
            :color="participant.state === 'DEAD' ? 'error' : 'neutral'"
          >
            {{ PARTICIPANT_STATE_LABELS[participant.state] }}
          </UBadge>
        </div>
      </div>

      <div class="shrink-0 text-right">
        <div class="text-lg font-bold text-highlighted">
          {{ participant.initiative }}
        </div>

        <div class="text-xs text-muted">
          {{ rollLabel }}
        </div>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between gap-3 text-sm">
      <span class="text-muted">HP</span>

      <span class="font-medium text-highlighted">{{ hpLabel }}</span>
    </div>

    <HpControls
      class="mt-3"
      compact
      :participant
      :readonly
      @damage="forwardDamage"
      @heal="forwardHeal"
      @temporary-hp="forwardTemporaryHp"
      @patch-hp="forwardPatchHp"
      @patch-state="forwardPatchState"
    />
  </li>
</template>
