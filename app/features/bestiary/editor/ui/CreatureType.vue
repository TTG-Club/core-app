<script setup lang="ts">
  import { ValidationDictionaries } from '~/shared/utils';
  import { SelectCreatureType } from '~ui/select';

  import type { CreatureTypes } from '~bestiary/types';

  const model = defineModel<CreatureTypes>({
    required: true,
  });

  watch(
    () => model.value.values,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        model.value.text = undefined;
      }
    },
  );
</script>

<template>
  <ACol :span="8">
    <AFormItem
      label="Типы существа"
      :name="['types', 'values']"
      :rules="[ValidationDictionaries.ruleCreatureTypes()]"
    >
      <SelectCreatureType
        v-model="model.values"
        multiple
      />
    </AFormItem>
  </ACol>

  <ACol :span="8">
    <AFormItem
      label="Уточнение типа"
      :name="['types', 'text']"
    >
      <AInput
        v-model:value="model.text"
        placeholder="Введи уточнение типа"
      />
    </AFormItem>
  </ACol>
</template>
