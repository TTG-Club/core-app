<script setup lang="ts">
  import { ValidationDictionaries } from '~/shared/utils';
  import { SelectSize } from '~ui/select';

  import type { CreatureSize } from '~bestiary/types';

  const model = defineModel<CreatureSize>({
    required: true,
  });

  watch(
    () => model.value.text,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        model.value.text = undefined;
      }
    },
  );
</script>

<template>
  <ACol :span="6">
    <AFormItem
      label="Размеры существа"
      :name="['size', 'value']"
      :rules="[ValidationDictionaries.ruleSize()]"
    >
      <SelectSize
        v-model="model.size"
        multiple
      />
    </AFormItem>
  </ACol>

  <ACol :span="6">
    <AFormItem
      label="Уточнение размера"
      :name="['size', 'text']"
    >
      <AInput
        v-model:value="model.text"
        placeholder="Введи уточнение размера"
      />
    </AFormItem>
  </ACol>
</template>
