<script setup lang="ts">
  import type { PlanRoom } from '../../model';

  import { PLAN_LABELS } from '../../model';

  /** Комнаты текущего этажа; щелчок выбирает комнату. */
  const { rooms } = defineProps<{
    rooms: ReadonlyArray<PlanRoom>;
  }>();

  const selectedRoomId = defineModel<string | undefined>('selected', {
    required: true,
  });

  /**
   * Классы строки: выбранная подсвечена.
   *
   * @param room Комната.
   * @returns Классы.
   */
  function getRowClass(room: PlanRoom): string {
    return room.id === selectedRoomId.value
      ? 'bg-elevated ring-1 ring-primary'
      : '';
  }

  /**
   * Выбирает комнату.
   *
   * @param room Комната.
   */
  function select(room: PlanRoom): void {
    selectedRoomId.value = room.id;
  }
</script>

<template>
  <section class="flex flex-col gap-1">
    <h3 class="text-sm font-semibold text-highlighted">
      {{ PLAN_LABELS.rooms }}
    </h3>

    <p
      v-if="!rooms.length"
      class="text-sm text-muted"
    >
      {{ PLAN_LABELS.noRooms }}
    </p>

    <button
      v-for="room in rooms"
      :key="room.id"
      type="button"
      class="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-elevated"
      :class="getRowClass(room)"
      @click.left.exact.prevent="select(room)"
    >
      <span class="truncate text-highlighted">{{ room.name }}</span>

      <span class="shrink-0 text-xs text-muted tabular-nums">
        {{ room.cells.length }}
      </span>
    </button>
  </section>
</template>
