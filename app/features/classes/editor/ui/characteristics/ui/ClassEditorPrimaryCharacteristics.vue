<script setup lang="ts">
  import { SelectAbilities } from '~ui/select';

  import type {
    AbilityDelimiter,
    ClassPrimaryCharacteristicsCreate,
  } from '~classes/model';

  const model = defineModel<ClassPrimaryCharacteristicsCreate>({
    required: true,
  });

  const primaryCharacteristicsOperatorOptions: Array<{
    label: string;
    value: AbilityDelimiter;
  }> = [
    { label: 'И', value: 'AND' },
    { label: 'ИЛИ', value: 'OR' },
  ];

  const isDisabled = computed(
    () => !model.value.values || model.value.values.length <= 1,
  );

  watch(
    () => model.value.values,
    (newValues) => {
      if (!newValues || newValues.length <= 1) {
        model.value.delimiter = undefined;
      }
    },
    { deep: true },
  );
</script>

<template>
  <div class="contents">
    <UFormField
      class="col-span-9"
      label="Основная характеристика"
      name="primaryCharacteristics.values"
    >
      <SelectAbilities
        v-model="model.values"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-3"
      label="Разделитель"
      name="primaryCharacteristics.delimiter"
    >
      <USelect
        v-model="model.delimiter"
        :disabled="isDisabled"
        :items="primaryCharacteristicsOperatorOptions"
        placeholder="Разделитель"
      />
    </UFormField>
  </div>
</template>
