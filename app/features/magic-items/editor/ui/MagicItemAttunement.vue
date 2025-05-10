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
  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Требуется настройка"
        :name="['attunement', 'requires']"
      >
        <ACheckbox v-model:checked="attunement.requires"> Требуется </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="16">
      <AFormItem
        label="Особенности настройки"
        :name="['attunement', 'description']"
      >
        <AInput
          v-model:value="description"
          :disabled="!isRequires"
          placeholder="Введи особенности настройки (если есть)"
          allow-clear
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
