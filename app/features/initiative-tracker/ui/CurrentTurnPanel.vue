<script setup lang="ts">
  import type { InitiativeParticipant, InitiativeTracker } from '../model';

  import { PARTICIPANT_STATE_LABELS, RELATION_TYPE_LABELS } from '../model';

  const props = defineProps<{
    tracker: InitiativeTracker;
    activeParticipant?: InitiativeParticipant;
    pendingAction?: string | null;
    readonly?: boolean;
  }>();

  const emit = defineEmits<{
    'start': [];
    'previous-turn': [];
    'next-turn': [];
    'previous-round': [];
    'next-round': [];
    'reroll-round': [];
    'finish': [];
  }>();

  const canStart = computed(
    () =>
      props.tracker.status === 'SETUP' && props.tracker.participants.length > 0,
  );

  const isActive = computed(() => props.tracker.status === 'ACTIVE');

  function emitStart(): void {
    emit('start');
  }

  function emitPreviousTurn(): void {
    emit('previous-turn');
  }

  function emitNextTurn(): void {
    emit('next-turn');
  }

  function emitPreviousRound(): void {
    emit('previous-round');
  }

  function emitNextRound(): void {
    emit('next-round');
  }

  function emitRerollRound(): void {
    emit('reroll-round');
  }

  function emitFinish(): void {
    emit('finish');
  }
</script>

<template>
  <UCard variant="outline">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-highlighted">Ход боя</h2>

        <UBadge
          variant="soft"
          color="primary"
        >
          Раунд {{ tracker.currentRound }}
        </UBadge>
      </div>
    </template>

    <div class="grid gap-4">
      <div
        v-if="activeParticipant"
        class="rounded-lg border border-primary bg-primary/10 p-4"
      >
        <p class="text-sm text-muted">Сейчас ходит</p>

        <h3 class="mt-1 text-2xl font-bold text-highlighted">
          {{ activeParticipant.name }}
        </h3>

        <div class="mt-3 flex flex-wrap gap-2">
          <UBadge variant="soft">
            Инициатива {{ activeParticipant.initiative }}
          </UBadge>

          <UBadge
            variant="soft"
            color="neutral"
          >
            {{ RELATION_TYPE_LABELS[activeParticipant.relationType] }}
          </UBadge>

          <UBadge
            variant="soft"
            color="neutral"
          >
            {{ PARTICIPANT_STATE_LABELS[activeParticipant.state] }}
          </UBadge>
        </div>
      </div>

      <UAlert
        v-else
        icon="tabler:hourglass"
        color="neutral"
        variant="soft"
        title="Активный участник не выбран"
      />

      <div
        v-if="!readonly && tracker.status === 'SETUP'"
        class="grid gap-2"
      >
        <UButton
          icon="tabler:player-play"
          :disabled="!canStart"
          :loading="pendingAction === 'start'"
          block
          @click.left.exact.prevent="emitStart"
        >
          Начать бой
        </UButton>
      </div>

      <div
        v-if="!readonly && isActive"
        class="grid gap-2"
      >
        <div class="grid grid-cols-2 gap-2">
          <UButton
            icon="tabler:arrow-left"
            variant="soft"
            color="neutral"
            :loading="pendingAction === 'previous-turn'"
            @click.left.exact.prevent="emitPreviousTurn"
          >
            Предыдущий ход
          </UButton>

          <UButton
            trailing-icon="tabler:arrow-right"
            :loading="pendingAction === 'next-turn'"
            @click.left.exact.prevent="emitNextTurn"
          >
            Следующий ход
          </UButton>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <UButton
            icon="tabler:chevrons-left"
            variant="soft"
            color="neutral"
            :loading="pendingAction === 'previous-round'"
            @click.left.exact.prevent="emitPreviousRound"
          >
            Предыдущий раунд
          </UButton>

          <UButton
            trailing-icon="tabler:chevrons-right"
            variant="soft"
            color="neutral"
            :loading="pendingAction === 'next-round'"
            @click.left.exact.prevent="emitNextRound"
          >
            Следующий раунд
          </UButton>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <UButton
            icon="tabler:dice"
            color="warning"
            variant="soft"
            :loading="pendingAction === 'reroll-round'"
            @click.left.exact.prevent="emitRerollRound"
          >
            Перебросить
          </UButton>

          <UButton
            icon="tabler:flag"
            color="error"
            variant="soft"
            :loading="pendingAction === 'finish'"
            @click.left.exact.prevent="emitFinish"
          >
            Завершить бой
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
