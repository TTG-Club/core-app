<script setup lang="ts">
  import type { BastionActivity, PlayerBastion } from '../model';

  import { BASTION_CARD_UI, EVENT_LABELS } from '../model';
  import { BastionEventCard } from './ui';

  /**
   * События бастиона, которые ждут решения: видны над персонажами, чтобы игрок
   * не пропустил взятку, удачный случай или просьбу о помощи.
   */
  const { bastion, activity } = defineProps<{
    bastion: PlayerBastion;
    activity: BastionActivity | undefined;
  }>();

  const emit = defineEmits<{
    updated: [bastion: PlayerBastion];
  }>();

  const pendingEvents = computed(
    () => activity?.events.filter((event) => event.status === 'PENDING') ?? [],
  );
</script>

<template>
  <UCard
    v-if="pendingEvents.length"
    variant="subtle"
    :ui="{ ...BASTION_CARD_UI, root: 'ring-warning/40' }"
  >
    <template #header>
      <h2
        class="flex items-center gap-2 text-base font-semibold text-highlighted"
      >
        <UIcon
          name="tabler:dice-6"
          class="size-5 text-warning"
        />

        {{ EVENT_LABELS.pendingTitle }}
      </h2>
    </template>

    <div class="flex flex-col gap-2">
      <BastionEventCard
        v-for="event in pendingEvents"
        :key="event.id"
        :bastion
        :event
        @updated="emit('updated', $event)"
      />
    </div>
  </UCard>
</template>
