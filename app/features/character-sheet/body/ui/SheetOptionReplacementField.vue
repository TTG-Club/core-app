<script setup lang="ts">
  import type {
    ClassChoice,
    ClassOptionReplacement,
    SheetChoiceControl,
    SheetChoiceOrigin,
  } from '../../model';

  import {
    buildChoiceControl,
    OPTION_REPLACEMENT_LABELS,
    SHEET_WIZARD_SECTION_TITLE_CLASS,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';

  /**
   * Необязательная замена варианта умения на новом уровне класса: игрок
   * называет, что убрать из взятого раньше, и что взять вместо него. Ответ —
   * пара «убрано, взято» под ключом замены уровня.
   */
  const { replacement, origin, choiceControl } = defineProps<{
    /** Замена уровня: что можно убрать и выбор «взять вместо». */
    replacement: ClassOptionReplacement;

    /** Умение, его источник и уровень — для подзаголовка окна. */
    origin: SheetChoiceOrigin;

    /** Выбор для единого пикера: пул вычитает взятое и убранное. */
    choiceControl: (
      choice: ClassChoice,
      origin: SheetChoiceOrigin,
    ) => SheetChoiceControl;
  }>();

  /** Пара «убрано, взято»; пусто — игрок ничего не заменяет. */
  const model = defineModel<string[]>({ default: () => [] });

  const removed = computed(() => model.value[0] ?? '');

  const taken = computed(() => model.value[1] ?? '');

  /** Что убрать: пул — варианты, взятые на прошлых уровнях. */
  const removeControl = computed(() =>
    buildChoiceControl(
      {
        ...replacement.choice,
        label: OPTION_REPLACEMENT_LABELS.remove,
        listed: replacement.removable,
      },
      {
        names: replacement.removable,
        origin,
        explanation: OPTION_REPLACEMENT_LABELS.removeExplanation,
      },
    ),
  );

  /** На что заменить: пул ступени этого уровня без взятого и убранного. */
  const takeControl = computed(() => ({
    ...choiceControl(
      { ...replacement.choice, label: OPTION_REPLACEMENT_LABELS.take },
      origin,
    ),
    explanation: OPTION_REPLACEMENT_LABELS.takeExplanation,
  }));

  const removedValues = computed(() => (removed.value ? [removed.value] : []));

  const takenValues = computed(() => (taken.value ? [taken.value] : []));

  /**
   * Новый убранный вариант. Снятый — снимает и замену целиком; взятое вместо
   * остаётся, если это не сам убранный вариант.
   *
   * @param values выбранное в поле «что убрать».
   */
  function handleRemove(values: string[]) {
    const next = values[0] ?? '';

    if (!next) {
      model.value = [];

      return;
    }

    model.value =
      taken.value && taken.value !== next ? [next, taken.value] : [next];
  }

  /**
   * Новый вариант взамен убранного.
   *
   * @param values выбранное в поле «на что заменить».
   */
  function handleTake(values: string[]) {
    const next = values[0] ?? '';

    model.value = next ? [removed.value, next] : [removed.value];
  }
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-lg border border-dashed border-default p-3"
  >
    <div class="flex flex-col gap-1">
      <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
        {{ OPTION_REPLACEMENT_LABELS.title }}
      </span>

      <span class="text-xs text-dimmed">
        {{ OPTION_REPLACEMENT_LABELS.hint }}
      </span>
    </div>

    <SheetChoicePickerField
      :title="removeControl.title"
      :explanation="removeControl.explanation"
      :modal-title="removeControl.modalTitle"
      :modal-subtitle="removeControl.modalSubtitle"
      :options="removeControl.options"
      :count="1"
      :model-value="removedValues"
      @update:model-value="handleRemove"
    />

    <SheetChoicePickerField
      v-if="removed"
      :title="takeControl.title"
      :explanation="takeControl.explanation"
      :modal-title="takeControl.modalTitle"
      :modal-subtitle="takeControl.modalSubtitle"
      :options="takeControl.options"
      :count="1"
      :status="takeControl.status"
      :model-value="takenValues"
      @update:model-value="handleTake"
    />

    <span
      v-else
      class="text-xs text-dimmed italic"
    >
      {{ OPTION_REPLACEMENT_LABELS.takeAfterRemove }}
    </span>
  </div>
</template>
