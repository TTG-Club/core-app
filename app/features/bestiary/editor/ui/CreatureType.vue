<script setup lang="ts">
  import { isEqual } from 'es-toolkit';
  import { SelectCreatureType } from '~ui/select';

  import type { CreatureTypes } from '~bestiary/types';

  const model = defineModel<CreatureTypes>({
    required: true,
  });

  function updateType(values: string | string[] | undefined) {
    if (!Array.isArray(values)) {
      throw new TypeError('[CreatureType] Incompatible values');
    }

    if (isEqual(model.value.values, values)) {
      return;
    }

    model.value.text = undefined;
    model.value.values = values;
  }
</script>

<template>
  <UForm
    class="col-span-16 grid grid-cols-2 gap-4"
    attach
    :state="model"
  >
    <UFormField
      label="Типы существа"
      class="col-span-1"
      name="values"
    >
      <SelectCreatureType
        v-model="model.values"
        multiple
        @update:model-value="updateType"
      />
    </UFormField>

    <UFormField
      label="Уточнение типа"
      class="col-span-1"
      name="text"
    >
      <UInput
        v-model="model.text"
        placeholder="Введи уточнение типа"
      />
    </UFormField>
  </UForm>
</template>
