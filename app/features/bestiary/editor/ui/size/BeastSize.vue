<script setup lang="ts">
  import { SelectBeastSize } from './ui';

  import { BeastSizeRule } from '~bestiary/editor/ui/size/validators';

  import type { BeastSize } from '~bestiary/types';

  const model = defineModel<BeastSize>({
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
      :name="['category', 'type']"
      :rules="[BeastSizeRule()]"
    >
      <SelectBeastSize v-model="model.size" />
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
