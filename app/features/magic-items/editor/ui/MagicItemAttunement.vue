<script setup lang="ts">
  import type { MagicItemAttunement } from '~magic-items/types';

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
    class="col-span-full grid grid-cols-24 gap-4"
    attach
    :state="attunement"
  >
    <UFormField
      class="col-span-full"
      name="requires"
    >
      <UCheckbox
        v-model="attunement.requires"
        label="Требуется настройка"
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      label="Особенности настройки"
      name="description"
    >
      <UInput
        v-model="description"
        :disabled="!isRequires"
        placeholder="Введи особенности настройки (если есть)"
        clearable
      />
    </UFormField>
  </UForm>
</template>
