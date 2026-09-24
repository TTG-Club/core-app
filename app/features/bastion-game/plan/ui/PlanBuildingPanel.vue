<script setup lang="ts">
  import type { BuildingKind, PlanBuilding } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import {
    BUILDING_KIND_LABELS,
    BUILDING_KINDS,
    getCellsInside,
    getLevelLabel,
    PLAN_LABELS,
  } from '../../model';

  /**
   * Выбранный корпус: название, вид, этажи. Этаж выше, подвал и удаление этажа —
   * отсюда; последний этаж не удаляется.
   */
  const { building, canEdit } = defineProps<{
    building: PlanBuilding;
    canEdit: boolean;
  }>();

  const emit = defineEmits<{
    'rename': [name: string];
    'change-kind': [kind: BuildingKind];
    'add-floor': [direction: 'up' | 'down'];
    'remove-floor': [level: number];
    'remove': [];
  }>();

  const kindItems = BUILDING_KINDS.map((kind) => ({
    label: BUILDING_KIND_LABELS[kind],
    value: kind,
  }));

  const levels = computed(() =>
    building.floors
      .map((floor) => floor.level)
      .sort((first, second) => second - first),
  );

  const cellsText = computed(() =>
    fillTemplate(PLAN_LABELS.cellsPerFloor, {
      cells: getCellsInside(building.outline).length,
    }),
  );

  /**
   * Переименовывает корпус.
   *
   * @param value Новое название.
   */
  function rename(value: string | number): void {
    emit('rename', String(value));
  }

  /**
   * Меняет вид корпуса.
   *
   * @param kind Вид.
   */
  function changeKind(kind: BuildingKind): void {
    emit('change-kind', kind);
  }
</script>

<template>
  <section class="flex flex-col gap-3">
    <UFormField :label="PLAN_LABELS.buildingName">
      <UInput
        id="plan-building-name"
        :model-value="building.name"
        :disabled="!canEdit"
        class="w-full"
        @update:model-value="rename"
      />
    </UFormField>

    <UFormField :label="PLAN_LABELS.buildingKind">
      <USelect
        id="plan-building-kind"
        :model-value="building.kind"
        :items="kindItems"
        value-key="value"
        :disabled="!canEdit"
        class="w-full"
        @update:model-value="changeKind"
      />
    </UFormField>

    <div class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-highlighted">
        {{ PLAN_LABELS.floors }}
        <span class="font-normal text-muted">· {{ cellsText }}</span>
      </span>

      <div
        v-for="level in levels"
        :key="level"
        class="flex items-center justify-between gap-2 text-sm"
      >
        <span>{{ getLevelLabel(level) }}</span>

        <UButton
          v-if="canEdit && levels.length > 1"
          icon="tabler:x"
          size="xs"
          color="neutral"
          variant="ghost"
          :aria-label="PLAN_LABELS.removeFloor"
          @click.left.exact.prevent="emit('remove-floor', level)"
        />
      </div>

      <div
        v-if="canEdit"
        class="flex gap-2"
      >
        <UButton
          icon="tabler:arrow-bar-to-up"
          size="xs"
          variant="subtle"
          @click.left.exact.prevent="emit('add-floor', 'up')"
        >
          {{ PLAN_LABELS.addFloorUp }}
        </UButton>

        <UButton
          icon="tabler:arrow-bar-to-down"
          size="xs"
          variant="subtle"
          @click.left.exact.prevent="emit('add-floor', 'down')"
        >
          {{ PLAN_LABELS.addFloorDown }}
        </UButton>
      </div>
    </div>

    <UButton
      v-if="canEdit"
      icon="tabler:trash"
      color="error"
      variant="subtle"
      size="sm"
      @click.left.exact.prevent="emit('remove')"
    >
      {{ PLAN_LABELS.removeBuilding }}
    </UButton>
  </section>
</template>
