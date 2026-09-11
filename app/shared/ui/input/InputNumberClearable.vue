<script setup lang="ts">
  /**
   * На сколько нижняя граница поля опущена ниже настоящей. Своя граница нужна
   * только для того, чтобы «минус» на настоящей границе оставался нажимаемым:
   * его нажатие снимает условие.
   */
  const CLEAR_STEP = 1;

  const { min, max } = defineProps<{
    min: number;
    max: number;
  }>();

  const model = defineModel<number | null>({ required: true });

  // Поле пустое, пока условие не задано, — `undefined` вместо `null`: иначе
  // поле показало бы ноль там, где числа ещё нет.
  const value = computed(() => model.value ?? undefined);

  const inputMin = computed(() => min - CLEAR_STEP);

  /**
   * Записывает значение поля.
   *
   * Ниже настоящей границы значение попадает двумя путями, и они различаются
   * прежним состоянием: с числом в поле это «минус» на самой границе — он
   * очищает поле, а с пустым полем это «плюс» — он ставит нижнюю границу
   * («минус» на пустом поле выключен: убавлять там нечего).
   *
   * @param next Значение из поля ввода.
   */
  function handleUpdate(next: number | null | undefined): void {
    if (typeof next !== 'number' || Number.isNaN(next)) {
      model.value = null;

      return;
    }

    if (next >= min) {
      model.value = next;

      return;
    }

    model.value = model.value === null ? min : null;
  }
</script>

<template>
  <UInputNumber
    :model-value="value"
    :min="inputMin"
    :max="max"
    :decrement-disabled="model === null"
    @update:model-value="handleUpdate"
  />
</template>
