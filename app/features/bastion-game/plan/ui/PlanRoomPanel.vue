<script setup lang="ts">
  import type { PlanPaletteFacility, PlanRoom, RoomKind } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    getRoomKindLabel,
    GRID_ROOM_KINDS,
    isTowerKind,
    PLAN_FEET_PER_CELL,
    PLAN_LABELS,
    ROOM_KIND_LABELS,
  } from '../../model';

  /**
   * Выбранная комната: название, вид, сооружение и площадь. Название
   * сохраняется по уходу из поля или Enter — иначе каждая буква была бы
   * отдельным шагом отмены.
   */
  const { room, facilities, canEdit } = defineProps<{
    room: PlanRoom;
    facilities: ReadonlyArray<PlanPaletteFacility>;
    canEdit: boolean;
  }>();

  const emit = defineEmits<{
    'rename': [name: string];
    'change-kind': [kind: RoomKind];
    'change-facility': [facilityId: string | undefined];
    'remove': [];
  }>();

  /** Значение пункта «без сооружения»: у USelect пустое значение не выбирается. */
  const NO_FACILITY = 'none';

  const name = ref(room.name);

  // Другая комната или отмена правки — поле показывает актуальное название.
  watch(
    () => room.name,
    (value) => {
      name.value = value;
    },
  );

  const kindItems = GRID_ROOM_KINDS.map((kind) => ({
    label: ROOM_KIND_LABELS[kind],
    value: kind,
  }));

  const facilityItems = computed(() => [
    { label: PLAN_LABELS.noFacility, value: NO_FACILITY },
    ...facilities.map((facility) => ({
      label: `${facility.name} · ${fillTemplate(PLAN_LABELS.area, {
        used: facility.used,
        max: facility.squares,
      })}`,
      value: facility.id,
    })),
  ]);

  const areaText = computed(() =>
    fillTemplate(PLAN_LABELS.roomArea, {
      cells: room.cells.length,
      feet: room.cells.length * PLAN_FEET_PER_CELL * PLAN_FEET_PER_CELL,
    }),
  );

  const isTower = computed(() => isTowerKind(room.kind));

  /** Сохраняет название, если оно поменялось и не пустое. */
  function commitName(): void {
    const trimmed = name.value.trim();

    if (!trimmed) {
      name.value = room.name;

      return;
    }

    if (trimmed !== room.name) {
      emit('rename', trimmed);
    }
  }

  /**
   * Меняет вид комнаты.
   *
   * @param kind Вид.
   */
  function changeKind(kind: RoomKind): void {
    emit('change-kind', kind);
  }

  /**
   * Назначает комнате сооружение или снимает его.
   *
   * @param value Сооружение или «без сооружения».
   */
  function changeFacility(value: string): void {
    emit('change-facility', value === NO_FACILITY ? undefined : value);
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <h3 class="text-sm font-semibold text-highlighted">
      {{ getRoomKindLabel(room) }}
    </h3>

    <UFormField :label="PLAN_LABELS.roomName">
      <UInput
        id="plan-room-name"
        v-model="name"
        :disabled="!canEdit"
        class="w-full"
        @blur="commitName"
        @keydown.enter.prevent="commitName"
      />
    </UFormField>

    <UFormField
      v-if="!isTower"
      :label="PLAN_LABELS.roomKind"
    >
      <USelect
        id="plan-room-kind"
        :model-value="room.kind"
        :items="kindItems"
        value-key="value"
        :disabled="!canEdit"
        class="w-full"
        @update:model-value="changeKind"
      />
    </UFormField>

    <UFormField :label="PLAN_LABELS.roomFacility">
      <USelect
        id="plan-room-facility"
        :model-value="room.facilityId ?? NO_FACILITY"
        :items="facilityItems"
        value-key="value"
        :disabled="!canEdit"
        class="w-full"
        @update:model-value="changeFacility"
      />
    </UFormField>

    <p class="text-sm text-muted tabular-nums">
      {{ areaText }}
    </p>

    <UButton
      v-if="canEdit"
      icon="tabler:trash"
      color="error"
      variant="subtle"
      size="sm"
      class="self-start"
      @click.left.exact.prevent="emit('remove')"
    >
      {{ PLAN_LABELS.removeRoom }}
    </UButton>
  </section>
</template>
