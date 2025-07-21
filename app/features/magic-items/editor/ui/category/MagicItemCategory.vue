<script setup lang="ts">
  import { SelectMagicItemCategory } from './ui';

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
      <SelectMagicItemCategory v-model="model.type" />
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
