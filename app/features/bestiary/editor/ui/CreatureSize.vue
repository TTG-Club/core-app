<script setup lang="ts">
  import type { CreatureSizes } from '~bestiary/model';

  import { SelectSize } from '~ui/select';

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
    class="col-span-full grid grid-cols-1 gap-4 md:col-span-18 md:grid-cols-24"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-full md:col-span-8"
      label="Размеры существа"
      name="values"
    >
      <SelectSize
        v-model="model.values"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-8"
      label="Уточнение размера"
      name="text"
    >
      <UInput
        v-model="model.text"
        placeholder="Введи уточнение размера"
      />
    </UFormField>

    <UFormField
      class="col-span-full md:col-span-8"
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
