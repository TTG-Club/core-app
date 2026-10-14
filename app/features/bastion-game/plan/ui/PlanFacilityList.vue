<script setup lang="ts">
  import type { PlanPaletteFacility } from '../../model';

  import { fillTemplate } from '~bastions/model';

  import { PLAN_LABELS } from '../../model';

  /**
   * Сооружения бастиона: цвет на плане и счётчик «занято / можно». Сооружение
   * назначается комнате в её карточке.
   */
  const { facilities } = defineProps<{
    facilities: ReadonlyArray<PlanPaletteFacility>;
  }>();

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
    <h3 class="text-sm font-semibold text-highlighted">
      {{ PLAN_LABELS.facilities }}
    </h3>

    <p
      v-if="!facilities.length"
      class="text-sm text-muted"
    >
      {{ PLAN_LABELS.noFacilities }}
    </p>

    <div
      v-for="facility in facilities"
      :key="facility.id"
      class="flex items-center gap-2 px-1 text-sm"
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
