<script setup lang="ts">
  import { ValidationDictionaries } from '~/shared/utils';
  import { SelectSize } from '~ui/select';

  import type { CreatureSize } from '~bestiary/types';

  const model = defineModel<CreatureSize>({
    required: true,
  });

  watchDebounced(
    () => [model.value.size, model.value.text],
    ([size, text], [oldSize, oldText]) => {
      if (size !== oldSize || text !== oldText) {
        model.value.sizeString = undefined;
      }
    },
    { debounce: 300 },
  );

  watchDebounced(
    () => model.value.sizeString,
    (sizeString, oldSizeString) => {
      if (sizeString !== oldSizeString) {
        model.value.size = [];
        model.value.text = undefined;
      }
    },
    { debounce: 300 },
  );
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Размеры существа"
        :name="['size', 'size']"
        :rules="[
          ValidationDictionaries.ruleSize({
            required: !Boolean(model.sizeString),
            array: true,
          }),
        ]"
      >
        <SelectSize
          v-model="model.size"
          multiple
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
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

    <ACol :span="8">
      <AFormItem
        label="Нестандартный размер"
        :name="['size', 'sizeString']"
      >
        <AInput
          v-model:value="model.sizeString"
          placeholder="Введи нестандартный размер"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
