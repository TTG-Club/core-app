<script setup lang="ts">
  import { useCharacterSheet } from '../../composables';
  import { HIT_POINT_STEP_BUTTONS } from '../../model';

  const emit = defineEmits<{
    close: [];
  }>();

  const { character, setHitPoints } = useCharacterSheet();

  const health = computed(() => character.value.health);

  // Цвет живого значения: ноль хитов — error, половина и меньше — warning.
  const valueClass = computed(() => {
    if (health.value.current <= 0) {
      return 'text-error';
    }

    if (health.value.max > 0 && health.value.current * 2 <= health.value.max) {
      return 'text-warning';
    }

    return 'text-highlighted';
  });

  /**
   * Применяет урон или лечение сразу. Урон сперва снимает временные хиты, затем
   * текущие; лечение поднимает текущие до максимума. Клампинг — в `setHitPoints`.
   *
   * @param delta смещение хитов (отрицательное — урон, положительное — лечение).
   */
  function applyDelta(delta: number): void {
    const { current, temporary } = health.value;

    if (delta < 0) {
      const damage = -delta;
      const fromTemp = Math.min(temporary, damage);

      setHitPoints(current - (damage - fromTemp), temporary - fromTemp);

      return;
    }

    setHitPoints(current + delta, temporary);
  }

  const expression = ref('');

  /** Ввод хитов: `20` — точное значение, `+3`/`-7` — сдвиг от текущих. */
  const HP_INPUT_PATTERN = /^([+-])?(\d+)$/;

  const isExpressionValid = computed(() =>
    HP_INPUT_PATTERN.test(expression.value.trim()),
  );

  /**
   * Применяет значение из поля: без знака — устанавливает точные текущие хиты
   * (временные не трогает), со знаком — урон/лечение через `applyDelta`.
   * Невалидный ввод просто очищает поле.
   */
  function applyExpression(): void {
    const match = HP_INPUT_PATTERN.exec(expression.value.trim());

    if (!match) {
      expression.value = '';

      return;
    }

    const [, sign, digits] = match;
    const amount = Number(digits);

    if (sign === '-') {
      applyDelta(-amount);
    } else if (sign === '+') {
      applyDelta(amount);
    } else {
      setHitPoints(amount, health.value.temporary);
    }

    expression.value = '';
  }
</script>

<template>
  <UModal title="Хиты">
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
            / {{ health.max }}
          </span>

          <span
            v-if="health.temporary > 0"
            class="pb-1 text-xl leading-none font-bold text-warning"
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
            Точное значение, + или −
          </span>

          <div class="h-px flex-1 bg-default" />
        </div>

        <!-- Поле точного значения / сдвига: «20» — установить, «-7» — урон. -->
        <div class="flex gap-2">
          <UInput
            v-model="expression"
            class="flex-1"
            placeholder="напр. -7, +3 или 20"
            :ui="{ base: 'text-center' }"
            aria-label="Новое значение хитов или сдвиг"
            @keydown.enter.prevent="applyExpression"
          />

          <UButton
            label="OK"
            color="neutral"
            variant="subtle"
            :disabled="!isExpressionValid"
            @click.left.exact.prevent="applyExpression"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          label="Готово"
          color="primary"
          @click.left.exact.prevent="emit('close')"
        />
      </div>
    </template>
  </UModal>
</template>
