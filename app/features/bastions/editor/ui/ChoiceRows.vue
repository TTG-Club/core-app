<script setup lang="ts">
  import type { FacilityChoiceForm } from '../../model';

  import { cloneDeep } from 'es-toolkit';

  import {
    BASTION_EDITOR_LABELS,
    EMPTY_CHOICE,
    EMPTY_CHOICE_OPTION,
  } from '../../model';
  import EditorRowsCard from './EditorRowsCard.vue';

  /**
   * Выборы сооружения: тип сада, мастер тренировочной зоны, тип гильдии.
   * В справочнике — только варианты; сделанный выбор живёт в бастионе игрока.
   */
  const model = defineModel<Array<FacilityChoiceForm>>({ required: true });

  /** Добавляет пустой выбор. */
  function addChoice(): void {
    model.value = [...model.value, cloneDeep(EMPTY_CHOICE)];
  }

  /**
   * Удаляет выбор.
   *
   * @param index - Номер выбора
   */
  function removeChoice(index: number): void {
    model.value = model.value.filter((_, position) => position !== index);
  }

  /**
   * Добавляет вариант в выбор.
   *
   * @param choice - Выбор сооружения
   */
  function addOption(choice: FacilityChoiceForm): void {
    choice.options = [...choice.options, { ...EMPTY_CHOICE_OPTION }];
  }

  /**
   * Удаляет вариант выбора.
   *
   * @param choice - Выбор сооружения
   * @param index - Номер варианта
   */
  function removeOption(choice: FacilityChoiceForm, index: number): void {
    choice.options = choice.options.filter((_, position) => position !== index);
  }
</script>

<template>
  <EditorRowsCard
    :title="BASTION_EDITOR_LABELS.choicesTitle"
    :hint="BASTION_EDITOR_LABELS.choicesHint"
    :empty="BASTION_EDITOR_LABELS.choicesEmpty"
    :add-label="BASTION_EDITOR_LABELS.addChoice"
    :count="model.length"
    @add="addChoice"
  >
    <div
      v-for="(choice, index) in model"
      :key="index"
      class="grid grid-cols-1 items-end gap-3 rounded-lg bg-elevated/40 p-2 md:grid-cols-24"
    >
      <UFormField
        class="md:col-span-13"
        :label="BASTION_EDITOR_LABELS.choiceName"
      >
        <UInput
          v-model="choice.name"
          :placeholder="BASTION_EDITOR_LABELS.choiceNamePlaceholder"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-5"
        :label="BASTION_EDITOR_LABELS.choiceCount"
      >
        <UInputNumber
          v-model="choice.count"
          :min="1"
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="md:col-span-5"
        :label="BASTION_EDITOR_LABELS.choiceEnlargedCount"
      >
        <UInputNumber
          v-model="choice.enlargedCount"
          :min="1"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end md:col-span-1">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="BASTION_EDITOR_LABELS.remove"
          @click.left.exact.prevent="removeChoice(index)"
        />
      </div>

      <UFormField
        class="md:col-span-24"
        :label="BASTION_EDITOR_LABELS.choiceDescription"
      >
        <UTextarea
          v-model="choice.description"
          :rows="1"
          autoresize
          class="w-full"
        />
      </UFormField>

      <div
        class="flex flex-col gap-2 border-l-2 border-default pl-3 md:col-span-24"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-muted">
            {{ BASTION_EDITOR_LABELS.choiceOptions }}
          </span>

          <UButton
            icon="tabler:plus"
            variant="ghost"
            size="xs"
            @click.left.exact.prevent="addOption(choice)"
          >
            {{ BASTION_EDITOR_LABELS.addChoiceOption }}
          </UButton>
        </div>

        <div
          v-for="(option, optionIndex) in choice.options"
          :key="optionIndex"
          class="grid grid-cols-1 items-end gap-2 md:grid-cols-24"
        >
          <UFormField
            class="md:col-span-7"
            :label="BASTION_EDITOR_LABELS.choiceOptionName"
          >
            <UInput
              v-model="option.name"
              class="w-full"
            />
          </UFormField>

          <UFormField
            class="md:col-span-16"
            :label="BASTION_EDITOR_LABELS.choiceOptionDescription"
          >
            <UInput
              v-model="option.description"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end md:col-span-1">
            <UButton
              icon="tabler:trash"
              color="error"
              variant="ghost"
              size="xs"
              :aria-label="BASTION_EDITOR_LABELS.remove"
              @click.left.exact.prevent="removeOption(choice, optionIndex)"
            />
          </div>
        </div>
      </div>
    </div>
  </EditorRowsCard>
</template>
