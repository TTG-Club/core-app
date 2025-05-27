<script setup lang="ts">
  import { ValidationDictionaries } from '~/shared/utils';
  import { SelectCreatureType } from '~ui/select';

  import type { CreatureCategory } from '~bestiary/types';

  const model = defineModel<CreatureCategory>({
    required: true,
  });

  watch(
    () => model.value.type,
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
      :name="['type', 'type']"
      :rules="[ValidationDictionaries.ruleCreatureType()]"
    >
      <SelectCreatureType v-model="model.type" />
    </AFormItem>
  </ACol>

  <ACol :span="8">
    <AFormItem
      label="Уточнение типа"
      :name="['category', 'text']"
    >
      <AInput
        v-model:value="model.text"
        placeholder="Введи уточнение типа"
      />
    </AFormItem>
  </ACol>
</template>
