<script setup lang="ts">
  import { SelectSize } from '~ui/select';

  import type { CreatureSizes } from '~bestiary/types';

  const model = defineModel<CreatureSizes>({
    required: true,
  });

  watchDebounced(
    () => [model.value.values, model.value.text],
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
        model.value.values = [];
        model.value.text = undefined;
      }
    },
    { debounce: 300 },
  );
</script>

<template>
  <UForm
    class="col-span-18 grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-8"
      label="Размеры существа"
      name="values"
    >
      <SelectSize
        v-model="model.values"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Уточнение размера"
      name="text"
    >
      <UInput
        v-model="model.text"
        placeholder="Введи уточнение размера"
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Нестандартный размер"
      name="sizeString"
    >
      <UInput
        v-model="model.sizeString"
        placeholder="Введи нестандартный размер"
      />
    </UFormField>
  </UForm>
</template>
