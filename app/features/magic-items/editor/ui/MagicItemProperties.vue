<script setup lang="ts">
  import { MAGIC_ITEM_FORM_LABELS } from '../../model';

  const focus = defineModel<boolean>('focus', { required: true });
  const adamantine = defineModel<boolean>('adamantine', { required: true });
</script>

<template>
  <div class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24">
    <UFormField
      class="md:col-span-12"
      name="focus"
    >
      <UCheckbox
        v-model="focus"
        :label="MAGIC_ITEM_FORM_LABELS.focus"
        :description="MAGIC_ITEM_FORM_LABELS.focusHint"
      />
    </UFormField>

    <UFormField
      class="md:col-span-12"
      name="adamantine"
    >
      <UCheckbox
        v-model="adamantine"
        :label="MAGIC_ITEM_FORM_LABELS.adamantine"
        :description="MAGIC_ITEM_FORM_LABELS.adamantineHint"
      />
    </UFormField>
  </div>
</template>
