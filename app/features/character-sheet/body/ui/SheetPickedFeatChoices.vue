<script setup lang="ts">
  import type { ClassChoice, SheetChoiceControl } from '../../model';

  import SheetChoicePickerField from './SheetChoicePickerField.vue';

  const { controls = [], selections } = defineProps<{
    /**
     * Показанные выборы самой черты, готовые для единого пикера. Не переданы —
     * черта не взята либо её деталь ещё в пути, и спрашивать нечего.
     */
    controls?: SheetChoiceControl[];

    /** Ответы игрока по идентификатору выбора. */
    selections: Record<string, string[]>;
  }>();

  const emit = defineEmits<{
    'update:selection': [choice: ClassChoice, values: string[]];
    'retry': [choice: ClassChoice];
  }>();

  /**
   * Ответ на выбор черты; лишнее сверх требуемого числа отсекается.
   *
   * @param control выбор черты.
   * @param values выбранные значения.
   */
  function handleSelection(control: SheetChoiceControl, values: string[]) {
    emit(
      'update:selection',
      control.choice,
      control.requiredCount > 0
        ? values.slice(0, control.requiredCount)
        : values,
    );
  }

  /**
   * Пул заклинаний выбора не загрузился — просит запросить его заново.
   *
   * @param choice выбор черты.
   */
  function handleRetry(choice: ClassChoice) {
    emit('retry', choice);
  }
</script>

<template>
  <!-- Выборы самой черты — под её полем, как в окне добавления черты:
    «Посвящённый в магию» просит список, заговоры и заклинание -->
  <SheetChoicePickerField
    v-for="control in controls"
    :key="control.choice.id"
    :title="control.title"
    :explanation="control.explanation"
    :modal-title="control.modalTitle"
    :modal-subtitle="control.modalSubtitle"
    :options="control.options"
    :count="control.requiredCount"
    :status="control.status"
    :warning="control.warning"
    :model-value="selections[control.choice.id] ?? []"
    @update:model-value="handleSelection(control, $event)"
    @retry="handleRetry(control.choice)"
  />
</template>
