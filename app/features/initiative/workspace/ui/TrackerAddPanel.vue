<script setup lang="ts">
  import type { SheetPlayerOption } from '~initiative/model';

  import CreatureAddForm from './CreatureAddForm.vue';
  import PlayerAddForm from './PlayerAddForm.vue';
  import SheetPlayerAddForm from './SheetPlayerAddForm.vue';

  const {
    open = false,
    playerCount,
    creatureCount,
    canAddPlayer,
    canAddCreature,
    remainingCreatures,
    isMutating = false,
    linkedSheetIds,
  } = defineProps<{
    open?: boolean;
    playerCount: number;
    creatureCount: number;
    canAddPlayer: boolean;
    canAddCreature: boolean;
    remainingCreatures: number;
    isMutating?: boolean;

    /** Листы, персонажи которых уже стоят в бою. */
    linkedSheetIds: Set<string>;
  }>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    'add-player': [name: string, bonus: number, armorClass: number];
    'add-sheet-player': [option: SheetPlayerOption];
    'add-creatures': [url: string, count: number, name?: string];
  }>();

  function onAddPlayer(name: string, bonus: number, armorClass: number): void {
    emit('add-player', name, bonus, armorClass);
  }

  function onAddSheetPlayer(option: SheetPlayerOption): void {
    emit('add-sheet-player', option);
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

    <!-- На широком экране (xl) три источника участников стоят в один ряд и
         одной высоты — flex тянет их сам. Доли разные: у каждой формы своё
         число полей. На среднем экране форма листов забирает первую строку, а
         игрок с существами делят вторую. Гостю форма листов не рендерится, и
         остальные две делят ряд сами: у flex, в отличие от колонок грида,
         дырки на её месте не будет. -->
    <div
      v-if="open"
      class="flex flex-col gap-4 md:flex-row md:flex-wrap xl:flex-nowrap"
    >
      <SheetPlayerAddForm
        class="min-w-0 md:basis-full xl:flex-5"
        :disabled="!canAddPlayer"
        :loading="isMutating"
        :linked-sheet-ids="linkedSheetIds"
        @add="onAddSheetPlayer"
      />

      <PlayerAddForm
        class="min-w-0 md:flex-7"
        :count="playerCount"
        :disabled="!canAddPlayer"
        :loading="isMutating"
        @add="onAddPlayer"
      />

      <CreatureAddForm
        class="min-w-0 md:flex-9"
        :count="creatureCount"
        :disabled="!canAddCreature"
        :loading="isMutating"
        :remaining="remainingCreatures"
        @add="onAddCreatures"
      />
    </div>
  </div>
</template>
