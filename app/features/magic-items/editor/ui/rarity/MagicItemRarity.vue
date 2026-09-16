<script setup lang="ts">
  import type { MagicItemRarity } from '../../../model';

  import { MAGIC_ITEM_FORM_LABELS } from '../../../model';
  import { SelectRarity } from './ui';

  const model = defineModel<MagicItemRarity>({
    required: true,
  });

  const isVaries = computed(() => model.value.type === 'VARIES');

  watch(isVaries, (value) => {
    if (value) {
      return;
    }

    model.value.varies = undefined;
  });
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="model"
  >
    <UFormField
      class="md:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.rarity"
      name="type"
    >
      <SelectRarity
        v-model="model.type"
        :placeholder="MAGIC_ITEM_FORM_LABELS.rarityPlaceholder"
      />
    </UFormField>

    <UFormField
      class="md:col-span-16"
      :label="MAGIC_ITEM_FORM_LABELS.rarityVaries"
      name="varies"
    >
      <UInput
        v-model="model.varies"
        :disabled="!isVaries"
        :placeholder="MAGIC_ITEM_FORM_LABELS.rarityVariesPlaceholder"
        clearable
      />
    </UFormField>
  </UForm>
</template>
