<script setup lang="ts">
  import { SelectRarity } from './ui';

  import type { MagicItemRarity } from '~magic-items/types';

  const model = defineModel<MagicItemRarity>({
    required: true,
  });

  const isVaries = computed(() => model.value.type == 'VARIES');

  watch(isVaries, (value) => {
    if (value) {
      return;
    }

    model.value.varies = undefined;
  });
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="model"
  >
    <UFormField
      class="col-span-8"
      label="Редкость"
      name="type"
    >
      <SelectRarity
        v-model="model.type"
        placeholder="Выбери редкость"
      />
    </UFormField>

    <UFormField
      class="col-span-16"
      label="Текст редкости"
      name="varies"
    >
      <UInput
        v-model="model.varies"
        :disabled="!isVaries"
        placeholder="Введи текст для варьируемой редкости"
        clearable
      />
    </UFormField>
  </UForm>
</template>
