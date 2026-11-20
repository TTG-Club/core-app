<script setup lang="ts">
  import {
    parseHitPointsExpression,
    SHEET_HIT_POINTS_CALCULATOR_LABELS,
  } from '../../model';

  const emit = defineEmits<{
    /** Сдвиг хитов: отрицательный — урон, положительный — лечение. */
    change: [delta: number];
    /** Точное значение текущих хитов (число без знака по Enter). */
    set: [value: number];
  }>();

  const expression = ref('');

  const parsedExpression = computed(() =>
    parseHitPointsExpression(expression.value),
  );

  /** Количество для кнопок «Урон»/«Лечение»; знак в поле они не учитывают. */
  const amount = computed(() => parsedExpression.value?.amount ?? 0);

  const isAmountEmpty = computed(() => amount.value <= 0);

  /**
   * Применяет количество из поля как урон или лечение и очищает поле: следующий
   * удар вводится с чистого листа.
   *
   * @param direction `-1` — урон, `1` — лечение.
   */
  function applyAmount(direction: -1 | 1): void {
    if (isAmountEmpty.value) {
      return;
    }

    emit('change', direction * amount.value);
    expression.value = '';
  }

  /** Кнопка «Урон»: количество из поля снимает хиты. */
  function handleDamage(): void {
    applyAmount(-1);
  }

  /** Кнопка «Лечение»: количество из поля восстанавливает хиты. */
  function handleHeal(): void {
    applyAmount(1);
  }

  /**
   * Enter в поле: `-7` — урон, `+3` — лечение, `20` — точное значение текущих
   * хитов. Невалидный ввод просто очищает поле.
   */
  function handleEnter(): void {
    const parsed = parsedExpression.value;

    expression.value = '';

    if (!parsed) {
      return;
    }

    if (parsed.delta === null) {
      emit('set', parsed.amount);
    } else {
      emit('change', parsed.delta);
    }
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <UInput
      v-model="expression"
      size="lg"
      inputmode="numeric"
      :placeholder="SHEET_HIT_POINTS_CALCULATOR_LABELS.placeholder"
      :aria-label="SHEET_HIT_POINTS_CALCULATOR_LABELS.aria"
      :ui="{ base: 'text-center tabular-nums' }"
      @keydown.enter.prevent="handleEnter"
    />

    <div class="grid grid-cols-2 gap-2">
      <UButton
        icon="tabler:sword"
        color="error"
        variant="soft"
        size="lg"
        :label="SHEET_HIT_POINTS_CALCULATOR_LABELS.damage"
        :disabled="isAmountEmpty"
        class="justify-center"
        @click.left.exact.prevent="handleDamage"
      />

      <UButton
        icon="tabler:heart-plus"
        color="success"
        variant="soft"
        size="lg"
        :label="SHEET_HIT_POINTS_CALCULATOR_LABELS.heal"
        :disabled="isAmountEmpty"
        class="justify-center"
        @click.left.exact.prevent="handleHeal"
      />
    </div>

    <span class="text-xs text-dimmed">
      {{ SHEET_HIT_POINTS_CALCULATOR_LABELS.hint }}
    </span>
  </div>
</template>
