<script setup lang="ts">
  import type { FeatChoiceOption } from '../../model';

  import { FEAT_EDITOR_LABELS } from '../../model';

  /**
   * Построчный ввод вариантов «значение + подпись» — для строк, у которых
   * готового справочника нет: «вариант из описания», а также смешанные строки,
   * где набор собран из нескольких видов сразу.
   *
   * Значение уходит в механику как есть, подпись видит игрок.
   */
  const model = defineModel<Array<FeatChoiceOption>>({ required: true });

  /** Заводит пустой вариант: значение и подпись автор вписывает сам. */
  function addOption() {
    model.value = [...model.value, { value: '', name: '' }];
  }

  /**
   * Убирает вариант.
   *
   * @param index номер строки в списке.
   */
  function removeOption(index: number) {
    model.value = model.value.filter((_, position) => position !== index);
  }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      v-for="(option, index) in model"
      :key="index"
      class="flex items-center gap-2"
    >
      <UInput
        v-model="option.value"
        :placeholder="FEAT_EDITOR_LABELS.optionValue"
        size="sm"
        class="flex-1"
      />

      <UInput
        v-model="option.name"
        :placeholder="FEAT_EDITOR_LABELS.optionName"
        size="sm"
        class="flex-1"
      />

      <UButton
        icon="tabler:trash"
        color="error"
        variant="ghost"
        size="xs"
        :aria-label="`${FEAT_EDITOR_LABELS.optionValue} ${index + 1}`"
        @click.left.exact.prevent="removeOption(index)"
      />
    </div>

    <UButton
      icon="tabler:plus"
      :label="FEAT_EDITOR_LABELS.optionAdd"
      color="neutral"
      variant="subtle"
      size="xs"
      class="self-start"
      @click.left.exact.prevent="addOption"
    />
  </div>
</template>
