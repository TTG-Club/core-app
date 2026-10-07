<script setup lang="ts">
  import type { ClassSpellListMode, SheetChoiceOption } from '../../model';

  import {
    CLASS_SPELL_LIST_LABELS,
    getClassSpellListExplanation,
    isClassSpellListMode,
    SHEET_WIZARD_SECTION_TITLE_CLASS,
  } from '../../model';
  import SheetChoicePickerField from './SheetChoicePickerField.vue';

  /**
   * Выбор в умении, которое выдаёт «весь список класса»: взять список целиком
   * либо выбрать из него самому. Выбранные заклинания ложатся на лист
   * неподготовленными — подготовку игрок отмечает сам в пределах таблицы класса.
   */
  const {
    spellCount,
    options,
    preparedHint = '',
  } = defineProps<{
    /** Сколько заклинаний списка открыто на этом уровне класса. */
    spellCount: number;

    /** Заклинания списка вариантами пикера. */
    options: SheetChoiceOption[];

    /** Сколько готовят по таблице класса; пусто — таблица этого не считает. */
    preparedHint?: string;
  }>();

  const mode = defineModel<ClassSpellListMode>('mode', { required: true });

  const selected = defineModel<string[]>({ default: () => [] });

  const modeOptions = computed(() => [
    {
      value: 'all',
      label: CLASS_SPELL_LIST_LABELS.allLabel,
      description: CLASS_SPELL_LIST_LABELS.allDescription.replace(
        '{count}',
        String(spellCount),
      ),
    },
    {
      value: 'chosen',
      label: CLASS_SPELL_LIST_LABELS.chosenLabel,
      description: CLASS_SPELL_LIST_LABELS.chosenDescription,
    },
  ]);

  const isPickerVisible = computed(() => mode.value === 'chosen');

  const pickerExplanation = computed(() =>
    getClassSpellListExplanation(
      CLASS_SPELL_LIST_LABELS.pickerExplanation,
      preparedHint,
    ),
  );

  /**
   * Смена режима. Выбранное при переключении не сбрасывается: игрок мог
   * заглянуть в «весь список» и вернуться к своему выбору.
   *
   * @param value значение переключателя.
   */
  function handleModeChange(value: unknown) {
    if (isClassSpellListMode(value)) {
      mode.value = value;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <span :class="SHEET_WIZARD_SECTION_TITLE_CLASS">
      {{ CLASS_SPELL_LIST_LABELS.title }}
    </span>

    <URadioGroup
      :model-value="mode"
      :items="modeOptions"
      variant="list"
      color="primary"
      @update:model-value="handleModeChange"
    />

    <SheetChoicePickerField
      v-if="isPickerVisible"
      v-model="selected"
      :title="CLASS_SPELL_LIST_LABELS.pickerTitle"
      :explanation="pickerExplanation"
      :options="options"
    />
  </div>
</template>
