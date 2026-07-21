<script setup lang="ts">
  import CreatureAddForm from './CreatureAddForm.vue';
  import PlayerAddForm from './PlayerAddForm.vue';

  const {
    open = false,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    isMutating = false,
  } = defineProps<{
    open?: boolean;
    playerCount: number;
    creatureCount: number;
    canAddPlayer: boolean;
    canAddCreature: boolean;
    remainingCreatures: number;
    isMutating?: boolean;
  }>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    'add-player': [name: string, bonus: number, armorClass: number];
    'add-creatures': [url: string, count: number, name?: string];
  }>();

  function onAddPlayer(name: string, bonus: number, armorClass: number): void {
    emit('add-player', name, bonus, armorClass);
  }

  function onAddCreatures(url: string, count: number, name?: string): void {
    emit('add-creatures', url, count, name);
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <UButton
      :icon="open ? 'tabler:chevron-up' : 'tabler:user-plus'"
      color="neutral"
      variant="subtle"
      block
      @click.left.exact.prevent="emit('update:open', !open)"
    >
      {{ open ? 'Скрыть добавление' : 'Добавить участника' }}
    </UButton>

    <div
      v-if="open"
      class="grid items-start gap-4 md:grid-cols-5"
    >
      <PlayerAddForm
        class="md:col-span-2"
        :count="playerCount"
        :disabled="!canAddPlayer"
        :loading="isMutating"
        @add="onAddPlayer"
      />

      <CreatureAddForm
        class="md:col-span-3"
        :count="creatureCount"
        :disabled="!canAddCreature"
        :loading="isMutating"
        :remaining="remainingCreatures"
        @add="onAddCreatures"
      />
    </div>
  </div>
</template>
