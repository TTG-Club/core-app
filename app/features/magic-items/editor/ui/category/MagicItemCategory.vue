<script setup lang="ts">
  import { SelectMagicItemCategory } from './ui';
  import { ruleMagicItemCategory } from './validators';

  import type { MagicItemCategory } from '~magic-items/types';

  const model = defineModel<MagicItemCategory>({
    required: true,
  });

  watch(
    () => model.value.type,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        model.value.clarification = undefined;
      }
    },
  );
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Категория"
        :name="['category', 'type']"
        :rules="[ruleMagicItemCategory()]"
      >
        <SelectMagicItemCategory v-model="model.type" />
      </AFormItem>
    </ACol>

    <ACol :span="16">
      <AFormItem
        label="Уточнение категории"
        :name="['category', 'clarification']"
      >
        <AInput
          v-model:value="model.clarification"
          placeholder="Введи уточнение категории"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
