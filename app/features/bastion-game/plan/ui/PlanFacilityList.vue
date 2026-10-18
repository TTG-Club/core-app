<script setup lang="ts">
  import type { PlanPaletteFacility } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { PLAN_FACILITY_DRAG_TYPE, PLAN_LABELS } from '../../model';

  /**
   * Сооружения бастиона: цвет на плане и счётчик «занято / можно». Сооружение
   * назначается комнате в её карточке или перетаскивается на план готовой
   * обставленной комнатой — пока его ещё нет на плане. Там, где
   * перетаскивания нет (телефон, планшет), сооружение выбирают касанием, а
   * потом касаются места на плане.
   */
  const { facilities, canEdit, pickedId } = defineProps<{
    facilities: ReadonlyArray<PlanPaletteFacility>;
    canEdit: boolean;
    /** Сооружение, выбранное касанием: ждёт касания плана. */
    pickedId: string | undefined;
  }>();

  const emit = defineEmits<{
    /** Сооружение выбрали касанием, чтобы поставить его на план. */
    'pick': [facility: PlanPaletteFacility];
    /** Сооружение взяли, чтобы перетащить на план. */
    'drag-start': [facility: PlanPaletteFacility];
    'drag-end': [];
  }>();

  /**
   * Можно ли перетащить сооружение на план: только если его там ещё нет,
   * иначе готовая комната превысила бы его площадь.
   *
   * @param facility Сооружение.
   * @returns true, если можно тянуть.
   */
  function isDraggable(facility: PlanPaletteFacility): boolean {
    return canEdit && facility.used === 0;
  }

  /**
   * Начинает перетаскивание сооружения на план.
   *
   * @param event Событие перетаскивания.
   * @param facility Сооружение.
   */
  function handleDragStart(
    event: DragEvent,
    facility: PlanPaletteFacility,
  ): void {
    if (!isDraggable(facility)) {
      event.preventDefault();

      return;
    }

    event.dataTransfer?.setData(PLAN_FACILITY_DRAG_TYPE, facility.id);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }

    emit('drag-start', facility);
  }

  /**
   * Цвет для образца в CSS: холст хранит его числом.
   *
   * @param color Цвет 0xRRGGBB.
   * @returns Цвет в виде `#rrggbb`.
   */
  function toCssColor(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  /**
   * Подпись площади сооружения.
   *
   * @param facility Сооружение.
   * @returns «12 / 16».
   */
  function getAreaText(facility: PlanPaletteFacility): string {
    return fillTemplate(PLAN_LABELS.area, {
      used: facility.used,
      max: facility.squares,
    });
  }

  /**
   * Цвет счётчика: красный, если сооружение заняло больше своего пространства.
   *
   * @param facility Сооружение.
   * @returns Класс цвета.
   */
  function getAreaClass(facility: PlanPaletteFacility): string {
    return facility.used > facility.squares ? 'text-error' : 'text-muted';
  }
</script>

<template>
  <section class="flex flex-col gap-2">
    <p
      v-if="!facilities.length"
      class="text-sm text-muted"
    >
      {{ PLAN_LABELS.noFacilities }}
    </p>

    <p
      v-if="canEdit && facilities.length"
      class="text-xs text-muted"
    >
      {{ PLAN_LABELS.facilityDragHint }}
    </p>

    <div
      v-for="facility in facilities"
      :key="facility.id"
      class="flex items-center gap-2 rounded-md px-1 py-0.5 text-sm"
      :class="{
        'cursor-grab hover:bg-elevated active:cursor-grabbing':
          isDraggable(facility),
        'bg-elevated ring-1 ring-primary': facility.id === pickedId,
      }"
      :draggable="isDraggable(facility)"
      @click.left.exact.prevent="
        isDraggable(facility) && emit('pick', facility)
      "
      @dragstart="handleDragStart($event, facility)"
      @dragend="emit('drag-end')"
    >
      <span
        class="size-3 shrink-0 rounded-sm"
        :style="{ backgroundColor: toCssColor(facility.color) }"
      />

      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-highlighted">{{ facility.name }}</span>

        <span class="truncate text-xs text-muted">
          {{ facility.characterName }}
        </span>
      </span>

      <span
        class="shrink-0 text-xs tabular-nums"
        :class="getAreaClass(facility)"
      >
        {{ getAreaText(facility) }}
      </span>
    </div>
  </section>
</template>
