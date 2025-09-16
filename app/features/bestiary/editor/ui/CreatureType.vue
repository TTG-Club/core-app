<script setup lang="ts">
  import { SelectCreatureType } from '~ui/select';
  import { isEqual } from 'lodash-es';
  import type { CreatureTypes } from '~bestiary/types';

  const model = defineModel<CreatureTypes>({
    required: true,
  });

  function updateType(value: string | string[] | undefined): void {
    const next = normalize(value);

    if (isEqual(model.value.values, next)) {
      model.value.text = undefined;
      model.value.values = next;
    }
  }

  function normalize(value: string | string[] | undefined): string[] {
    if (value == null) return [];

    return Array.isArray(value) ? value : [value];
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
