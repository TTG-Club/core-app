<script setup lang="ts">
  import type { MagicItemCategory } from '../../../model';

  import { MAGIC_ITEM_FORM_LABELS } from '../../../model';
  import { SelectMagicItemCategory } from './ui';

  const model = defineModel<MagicItemCategory>({
    required: true,
  });

  function updateType(value: string | undefined) {
    model.value.type = value;

    model.value.clarification =
      model.value.type !== value ? undefined : model.value.clarification;
  }
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="model"
  >
    <UFormField
      class="md:col-span-8"
      :label="MAGIC_ITEM_FORM_LABELS.category"
      name="type"
    >
      <SelectMagicItemCategory
        :model-value="model.type"
        @update:model-value="updateType"
      />
    </UFormField>

    <UFormField
      class="md:col-span-16"
      :label="MAGIC_ITEM_FORM_LABELS.categoryClarification"
      name="clarification"
    >
      <UInput
        v-model="model.clarification"
        :placeholder="MAGIC_ITEM_FORM_LABELS.categoryClarificationPlaceholder"
      />
    </UFormField>
  </UForm>
</template>
