<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import {
    applyHitPointsDelta,
    HIT_POINT_STEP_BUTTONS,
    SHEET_HEALTH_QUICK_LABELS,
  } from '../../model';
  import SheetHitPointsCalculator from './SheetHitPointsCalculator.vue';

  const { sheetKey } = defineProps<{
    /** Ключ открытого листа: с каким листом работает компонент. */
    sheetKey: string;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, maxHitPoints, setHitPoints } = useCharacterSheet(sheetKey);

  const health = computed(() => character.value.health);

  // Цвет живого значения: ноль хитов — error, половина и меньше — warning.
  const valueClass = computed(() => {
    if (health.value.current <= 0) {
      return 'text-error';
    }

    if (
      maxHitPoints.value > 0
      && health.value.current * 2 <= maxHitPoints.value
    ) {
      return 'text-warning';
    }

    return 'text-highlighted';
  });

  /**
   * Применяет урон или лечение сразу: урон сперва снимает временные хиты,
   * остаток — текущие; лечение поднимает текущие до максимума.
   *
   * @param delta смещение хитов (отрицательное — урон, положительное — лечение).
   */
  function applyDelta(delta: number): void {
    const next = applyHitPointsDelta(health.value, delta, maxHitPoints.value);

    setHitPoints(next.current, next.temporary);
  }

  /**
   * Устанавливает точные текущие хиты, временные не трогает.
   *
   * @param value новые текущие хиты.
   */
  function setCurrent(value: number): void {
    setHitPoints(value, health.value.temporary);
  }
</script>

<template>
  <UModal :title="SHEET_HEALTH_QUICK_LABELS.title">
    <template #body>
      <div class="flex flex-col gap-4">
        <!-- Живое значение: меняется сразу при быстрых шагах и вводе. -->
        <div class="flex items-end justify-center gap-2">
          <span
            class="text-4xl leading-none font-bold tabular-nums"
            :class="valueClass"
          >
            {{ health.current }}
          </span>

          <span class="pb-1 text-xl leading-none text-muted">
            / {{ maxHitPoints }}
          </span>

          <span
            v-if="health.temporary > 0"
            class="pb-1 text-xl leading-none font-bold text-primary"
          >
            +{{ health.temporary }}
          </span>
        </div>

        <!-- Быстрые шаги: урон слева (error), лечение справа (success). -->
        <div class="flex gap-2">
          <UButton
            v-for="button in HIT_POINT_STEP_BUTTONS"
            :key="button.step"
            :color="button.color"
            variant="soft"
            size="lg"
            :label="button.label"
            class="flex-1 justify-center"
            @click.left.exact.prevent="applyDelta(button.step)"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="shrink-0 text-xs text-muted">
            {{ SHEET_HEALTH_QUICK_LABELS.expression }}
          </span>

          <div class="h-px flex-1 bg-default" />
        </div>

        <!-- Калькулятор: ввёл число — нажал «Урон» или «Лечение». -->
        <SheetHitPointsCalculator
          @change="applyDelta"
          @set="setCurrent"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          :label="SHEET_HEALTH_QUICK_LABELS.done"
          color="primary"
          @click.left.exact.prevent="emit('close')"
        />
      </div>
    </template>
  </UModal>
</template>
