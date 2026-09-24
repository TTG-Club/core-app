<script setup lang="ts">
  import type { PlanPaletteFacility } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { PLAN_LABELS } from '../../model';

  /**
   * Палитра сооружений для кисти: цвет на холсте и счётчик «занято / можно».
   */
  const { facilities, canEdit } = defineProps<{
    facilities: ReadonlyArray<PlanPaletteFacility>;
    canEdit: boolean;
  }>();

  const selectedFacilityId = defineModel<string | undefined>('selected', {
    required: true,
  });

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
   * Выбирает сооружение для кисти.
   *
   * @param facility Сооружение.
   */
  function select(facility: PlanPaletteFacility): void {
    if (canEdit) {
      selectedFacilityId.value = facility.id;
    }
  }
</script>

<template>
  <section class="flex flex-col gap-2">
    <h3 class="text-sm font-semibold text-highlighted">
      {{ PLAN_LABELS.facilities }}
    </h3>

    <p
      v-if="!facilities.length"
      class="text-sm text-muted"
    >
      {{ PLAN_LABELS.noFacilities }}
    </p>

    <button
      v-for="facility in facilities"
      :key="facility.id"
      type="button"
      class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-elevated"
      :class="{
        'bg-elevated ring-1 ring-primary': facility.id === selectedFacilityId,
      }"
      :disabled="!canEdit"
      @click.left.exact.prevent="select(facility)"
    >
      <span
        class="size-3.5 shrink-0 rounded-sm"
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
        :class="facility.used > facility.squares ? 'text-error' : 'text-muted'"
      >
        {{ getAreaText(facility) }}
      </span>
    </button>
  </section>
</template>
