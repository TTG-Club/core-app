<script setup lang="ts">
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
  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      label="Типы существа"
      class="col-span-8"
      name="values"
    >
      <SelectCreatureType
        v-model="model.values"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-16"
      label="Уточнение типа"
      name="text"
    >
      <UInput
        v-model="model.text"
        placeholder="Введи уточнение типа"
      />
    </UFormField>
  </UForm>
</template>
