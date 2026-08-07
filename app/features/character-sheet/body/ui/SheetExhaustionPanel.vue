<script setup lang="ts">
  import type { SpeedUnit } from '../../model';

  import {
    EXHAUSTION_LABELS,
    EXHAUSTION_LEVEL_MAX,
    EXHAUSTION_LEVEL_MIN,
    EXHAUSTION_LEVELS,
    EXHAUSTION_RULES,
    getExhaustionEffects,
    getExhaustionSummary,
    SHEET_TITLE_ACTION_CLASS,
  } from '../../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Класс деления: набранные закрашены, смертельное — красным, остальные ждут
   * нажатия.
   *
   * @param stepLevel уровень деления.
   * @param currentLevel текущий уровень истощения.
   * @returns классы деления.
   */
  function getStepClass(stepLevel: number, currentLevel: number): string {
    if (stepLevel > currentLevel) {
      return 'border-default text-muted hover:border-primary hover:text-primary';
    }

    return stepLevel === EXHAUSTION_LEVEL_MAX
      ? 'border-error bg-error/15 text-error'
      : 'border-primary bg-primary/15 text-primary';
  }

  const props = defineProps<{
    /** Текущий уровень истощения персонажа. */
    level: number;

    /** Единица скоростей листа: в ней считается снижение скорости. */
    speedUnit: SpeedUnit;
  }>();

  const emit = defineEmits<{
    select: [level: number];
  }>();

  const effects = computed(() => getExhaustionEffects(props.level));

  /**
   * Деления уровней: подсказка каждого рассказывает, что этот уровень даёт, —
   * так правила видны до нажатия.
   */
  const steps = computed(() =>
    EXHAUSTION_LEVELS.map((stepLevel) => ({
      level: stepLevel,
      isFilled: stepLevel <= effects.value.level,
      hint: getExhaustionSummary(stepLevel, props.speedUnit),
      label: `${EXHAUSTION_LABELS.level} ${stepLevel}`,
      stepClass: getStepClass(stepLevel, effects.value.level),
    })),
  );

  const summary = computed(() =>
    getExhaustionSummary(props.level, props.speedUnit),
  );

  const summaryClass = computed(() => {
    if (effects.value.isLethal) {
      return 'text-error';
    }

    return effects.value.level === EXHAUSTION_LEVEL_MIN
      ? 'text-dimmed'
      : 'text-warning';
  });

  /**
   * Нажатие на деление: чужое ставит свой уровень, текущее — снимает его
   * (уровень уходит на единицу ниже).
   *
   * @param stepLevel уровень нажатого деления.
   */
  function handleSelect(stepLevel: number): void {
    emit(
      'select',
      stepLevel === effects.value.level ? stepLevel - 1 : stepLevel,
    );
  }
</script>

<template>
  <SheetPanel
    :title="EXHAUSTION_LABELS.title"
    persistent-actions
  >
    <template #title-actions>
      <UPopover :ui="{ content: 'max-w-80 p-3' }">
        <!-- Кнопка справки повторяет шестерёнку соседних панелей, но видна
          всегда: подсказку по правилам искать наведением незачем. Клик вешает
          сам поповер — своего обработчика у неё нет -->
        <button
          type="button"
          :class="SHEET_TITLE_ACTION_CLASS"
          :aria-label="EXHAUSTION_LABELS.rulesTitle"
        >
          <!-- Залитый значок, а не контурный: у контурного на 3.5 буква «i»
            сливается с обводкой кружка -->
          <UIcon
            name="tabler:info-circle-filled"
            class="size-3.5"
          />
        </button>

        <template #content>
          <div class="flex flex-col gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ EXHAUSTION_LABELS.rulesTitle }}
            </span>

            <ul class="flex flex-col gap-1.5">
              <li
                v-for="rule in EXHAUSTION_RULES"
                :key="rule"
                class="flex gap-1.5 text-xs leading-relaxed text-toned"
              >
                <UIcon
                  name="tabler:point-filled"
                  class="mt-1 size-3 shrink-0 text-primary"
                />

                <span>{{ rule }}</span>
              </li>
            </ul>
          </div>
        </template>
      </UPopover>
    </template>

    <div class="flex flex-col gap-2 pt-1">
      <!-- Деления уровней: нажатие ставит уровень, повторное по текущему —
        снимает его. Шестое деление красное: на нём персонаж умирает -->
      <div class="grid grid-cols-6 gap-1">
        <UTooltip
          v-for="step in steps"
          :key="step.level"
          :text="step.hint"
        >
          <button
            type="button"
            class="flex h-7 w-full cursor-pointer items-center justify-center rounded-md border text-xs font-bold transition-colors"
            :class="step.stepClass"
            :aria-label="step.label"
            :aria-pressed="step.isFilled"
            @click.left.exact.prevent="handleSelect(step.level)"
          >
            {{ step.level }}
          </button>
        </UTooltip>
      </div>

      <p
        class="border-t border-default/50 pt-2 text-xs"
        :class="summaryClass"
      >
        {{ summary }}
      </p>
    </div>
  </SheetPanel>
</template>
