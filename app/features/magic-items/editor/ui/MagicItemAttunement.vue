<script setup lang="ts">
  import type { MagicItemAttunement } from '../../model';

  import { MAGIC_ITEM_FORM_LABELS } from '../../model';

  const attunement = defineModel<MagicItemAttunement>({
    required: true,
  });

  const description = computed({
    get: (): string | undefined => attunement.value.description || undefined,
    set: (value: string | undefined) => {
      attunement.value.description = value || null;
    },
  });

  const isRequires = computed(() => attunement.value.requires);

  watch(isRequires, (value) => {
    if (value) {
      return;
    }

    attunement.value.description = null;
  });
</script>

<template>
  <UForm
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="attunement"
  >
    <UFormField
      class="col-span-full"
      name="requires"
    >
      <UCheckbox
        v-model="attunement.requires"
        :label="MAGIC_ITEM_FORM_LABELS.attunementRequires"
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      :label="MAGIC_ITEM_FORM_LABELS.attunementDescription"
      name="description"
    >
      <UInput
        v-model="description"
        :disabled="!isRequires"
        :placeholder="MAGIC_ITEM_FORM_LABELS.attunementDescriptionPlaceholder"
        clearable
      />
    </UFormField>
  </UForm>
</template>
