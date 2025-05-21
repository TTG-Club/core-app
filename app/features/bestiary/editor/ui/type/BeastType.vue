<script setup lang="ts">
  import { SelectBeastType } from './ui';
  import { BeastTypeRule } from './validators';

  import type { BeastCategory } from '~bestiary/types';

  const model = defineModel<BeastCategory>({
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
      :rules="[BeastTypeRule()]"
    >
      <SelectBeastType v-model="model.type" />
    </AFormItem>
  </ACol>

  <ACol :span="4">
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
