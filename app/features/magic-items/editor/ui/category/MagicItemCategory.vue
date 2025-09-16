<script setup lang="ts">
  import { SelectMagicItemCategory } from './ui';

  import type { MagicItemCategory } from '~magic-items/types';

  const model = defineModel<MagicItemCategory>({
    required: true,
  });

  function updateType(value: string | undefined) {
    model.value.type = value;

    model.value.clarification =
      model.value.type != value ? undefined : model.value.clarification;
  }
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-8"
      label="Категория"
      name="type"
    >
      <SelectMagicItemCategory
        :model-value="model.type"
        @update:model-value="updateType"
      />
    </UFormField>

    <UFormField
      class="col-span-16"
      label="Уточнение категории"
      name="clarification"
    >
      <UInput
        v-model="model.clarification"
        placeholder="Введи уточнение категории"
      />
    </UFormField>
  </UForm>
</template>
