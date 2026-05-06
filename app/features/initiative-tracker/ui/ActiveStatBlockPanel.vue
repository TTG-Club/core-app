<script setup lang="ts">
  import type {
    ActiveCreatureBlock,
    HpAmountPayload,
    HpPatchPayload,
    InitiativeParticipant,
    InitiativeParticipantState,
  } from '../model';

  import { PARTICIPANT_TYPE_LABELS, RELATION_TYPE_LABELS } from '../model';
  import HpControls from './HpControls.vue';

  const props = defineProps<{
    participant?: InitiativeParticipant;
    activeBlock?: ActiveCreatureBlock | null;
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

  const statRows = computed(() => {
    const block = props.activeBlock;

    if (!block) {
      return [];
    }

    return [
      { label: 'КД', value: block.ac },
      { label: 'Хиты', value: block.hp },
      { label: 'Скорость', value: block.speed },
      { label: 'Спасброски', value: block.savingThrows },
      { label: 'Навыки', value: block.skills },
      { label: 'Сопротивления', value: block.resistances },
      { label: 'Иммунитеты', value: block.immunities },
      { label: 'Чувства', value: block.senses },
      { label: 'Языки', value: block.languages },
      { label: 'CR', value: block.challengeRating },
    ].filter((row) => Boolean(row.value));
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
  <aside class="grid gap-3">
    <h2 class="text-lg font-semibold text-highlighted">Активный участник</h2>

    <UCard
      v-if="participant"
      variant="subtle"
    >
      <div class="grid gap-4">
        <div>
          <div class="flex items-center justify-between gap-3">
            <h3 class="min-w-0 truncate text-xl font-bold text-highlighted">
              {{ participant.name }}
            </h3>

            <UBadge variant="soft">
              {{ PARTICIPANT_TYPE_LABELS[participant.type] }}
            </UBadge>
          </div>

          <p class="mt-1 text-sm text-muted">
            {{ RELATION_TYPE_LABELS[participant.relationType] }}
            · инициатива {{ participant.initiative }}
            <template v-if="participant.level">
              · уровень {{ participant.level }}
            </template>
          </p>
        </div>

        <HpControls
          :participant
          :readonly
          @damage="forwardDamage"
          @heal="forwardHeal"
          @temporary-hp="forwardTemporaryHp"
          @patch-hp="forwardPatchHp"
          @patch-state="forwardPatchState"
        />

        <div
          v-if="participant.type === 'CREATURE' && activeBlock"
          class="grid gap-3"
        >
          <dl class="grid gap-2 text-sm">
            <div
              v-for="row in statRows"
              :key="row.label"
              class="grid grid-cols-[96px_minmax(0,1fr)] gap-2"
            >
              <dt class="font-semibold text-highlighted">
                {{ row.label }}
              </dt>

              <dd class="text-default">
                {{ row.value }}
              </dd>
            </div>
          </dl>

          <div
            v-if="activeBlock.abilities"
            class="grid grid-cols-3 gap-2 text-center text-sm"
          >
            <div
              v-for="(abilityValue, abilityName) in activeBlock.abilities"
              :key="abilityName"
              class="rounded-md border border-default bg-default p-2"
            >
              <div class="text-xs text-muted uppercase">
                {{ abilityName }}
              </div>

              <div class="font-semibold text-highlighted">
                {{ abilityValue }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UAlert
      v-else
      icon="tabler:user-question"
      color="neutral"
      variant="soft"
      title="Нет активного участника"
    />
  </aside>
</template>
