<script setup lang="ts">
  import type {
    TrackerParticipant,
    UpdateParticipantRequest,
  } from '~initiative/model';

  import { ConfirmDialog } from '~initiative/ui-kit';

  import InitiativeReel from './InitiativeReel.vue';
  import InitiativeReelSkeleton from './InitiativeReelSkeleton.vue';
  import ParticipantRow from './ParticipantRow.vue';
  import TrackerAddPanel from './TrackerAddPanel.vue';

  const {
    participants,
    isActive = false,
    currentParticipantId = undefined,
    round,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    isMutating = false,
  } = defineProps<{
    participants: Array<TrackerParticipant>;
    isActive?: boolean;
    currentParticipantId?: string;
    round: number;
    playerCount: number;
    creatureCount: number;
    canAddPlayer: boolean;
    canAddCreature: boolean;
    remainingCreatures: number;
    isMutating?: boolean;
  }>();

  const emit = defineEmits<{
    'add-player': [name: string, bonus: number];
    'add-creatures': [url: string, count: number, name?: string];
    'edit-participant': [id: string, patch: UpdateParticipantRequest];
    'remove-participant': [id: string];
    'roll-participant': [id: string];
    'toggle-dead': [id: string, dead: boolean];
    'roll': [];
    'start': [];
    'next': [];
    'reset': [];
  }>();

  // Состояние блока добавления запоминается между настройкой и боем: по
  // умолчанию открыт в подготовке, дальше — как оставил пользователь. Компонент
  // при смене статуса не пересоздаётся, поэтому значение сохраняется само.
  const isAddOpen = ref(!isActive);

  const isRerollOpen = ref(false);
  const isResetOpen = ref(false);

  const canStart = computed(() => participants.length > 0 && !isMutating);

  function isCurrent(participant: TrackerParticipant): boolean {
    return participant.id === currentParticipantId;
  }

  function onAddPlayer(name: string, bonus: number): void {
    emit('add-player', name, bonus);
  }

  function onAddCreatures(url: string, count: number, name?: string): void {
    emit('add-creatures', url, count, name);
  }

  function onEditParticipant(
    id: string,
    patch: UpdateParticipantRequest,
  ): void {
    emit('edit-participant', id, patch);
  }

  function onRemoveParticipant(id: string): void {
    emit('remove-participant', id);
  }

  function onRollParticipant(id: string): void {
    emit('roll-participant', id);
  }

  function onToggleDead(id: string, dead: boolean): void {
    emit('toggle-dead', id, dead);
  }

  function confirmReroll(): void {
    isRerollOpen.value = false;
    emit('roll');
  }

  function confirmReset(): void {
    isResetOpen.value = false;
    emit('reset');
  }
</script>

<template>
  <div class="flex flex-col gap-5">
    <InitiativeReel
      v-if="isActive"
      :participants="participants"
      :current-participant-id="currentParticipantId"
      :round="round"
    />

    <InitiativeReelSkeleton v-else />

    <div
      v-if="isActive"
      class="flex items-center gap-2"
    >
      <UButton
        class="flex-1 justify-center"
        size="xl"
        icon="tabler:arrow-big-right-lines"
        :loading="isMutating"
        :disabled="isMutating"
        @click.left.exact.prevent="emit('next')"
      >
        Следующий ход
      </UButton>

      <UTooltip text="Ре-ролл инициативы">
        <UButton
          size="xl"
          icon="tabler:refresh"
          color="neutral"
          variant="subtle"
          :disabled="isMutating"
          aria-label="Ре-ролл инициативы"
          @click.left.exact.prevent="isRerollOpen = true"
        />
      </UTooltip>

      <UTooltip text="Завершить бой">
        <UButton
          size="xl"
          icon="tabler:flag"
          color="neutral"
          variant="subtle"
          :disabled="isMutating"
          aria-label="Завершить бой"
          @click.left.exact.prevent="isResetOpen = true"
        />
      </UTooltip>
    </div>

    <div
      v-if="!isActive"
      class="flex items-center gap-2"
    >
      <UTooltip text="Прокинуть инициативу всем">
        <UButton
          size="xl"
          icon="tabler:dice-5"
          color="primary"
          variant="outline"
          :loading="isMutating"
          :disabled="!canStart"
          aria-label="Прокинуть инициативу всем"
          @click.left.exact.prevent="emit('roll')"
        />
      </UTooltip>

      <UButton
        class="flex-1 justify-center"
        size="xl"
        icon="tabler:swords"
        :loading="isMutating"
        :disabled="!canStart"
        @click.left.exact.prevent="emit('start')"
      >
        Начать бой
      </UButton>
    </div>

    <TrackerAddPanel
      v-model:open="isAddOpen"
      :player-count="playerCount"
      :creature-count="creatureCount"
      :can-add-player="canAddPlayer"
      :can-add-creature="canAddCreature"
      :remaining-creatures="remainingCreatures"
      :is-mutating="isMutating"
      @add-player="onAddPlayer"
      @add-creatures="onAddCreatures"
    />

    <div
      v-if="participants.length"
      class="flex flex-col gap-2"
    >
      <ParticipantRow
        v-for="(participant, index) in participants"
        :key="participant.id"
        :participant="participant"
        :is-active="isActive"
        :is-current="isActive && isCurrent(participant)"
        :order="index + 1"
        :disabled="isMutating"
        @edit="onEditParticipant"
        @remove="onRemoveParticipant"
        @roll="onRollParticipant"
        @toggle-dead="onToggleDead"
      />
    </div>

    <div
      v-else
      class="rounded-lg border border-dashed border-default p-8 text-center text-sm text-secondary"
    >
      Соберите отряд — добавьте игроков и существ бестиария.
    </div>

    <ConfirmDialog
      v-model:open="isRerollOpen"
      title="Ре-ролл инициативы?"
      description="Все броски будут перекинуты заново, бой начнётся с первого раунда."
      confirm-label="Перекинуть"
      confirm-icon="tabler:refresh"
      @confirm="confirmReroll"
    />

    <ConfirmDialog
      v-model:open="isResetOpen"
      title="Завершить бой?"
      description="Броски очистятся, состав сохранится — трекер вернётся к подготовке."
      confirm-label="Завершить бой"
      confirm-color="warning"
      confirm-icon="tabler:flag"
      @confirm="confirmReset"
    />
  </div>
</template>
