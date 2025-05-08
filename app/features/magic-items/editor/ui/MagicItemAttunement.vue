<script setup lang="ts">
  import type { Attunement } from '~magic-items/types';

  const attunement = defineModel<Attunement>({
    required: true,
  });

  const description = computed({
    get: (): string | undefined => attunement.value.description || undefined,
    set: (value: string | undefined) => value || null,
  });

  watch(
    () => attunement.value.requires,
    (value) => {
      if (!value) {
        attunement.value.description = null;
      }
    },
  );
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Требуется настройка"
        :name="['attunement', 'requires']"
      >
        <ACheckbox v-model:checked="attunement.requires"> Требуется </ACheckbox>
      </AFormItem>
    </ACol>

    <ACol :span="20">
      <AFormItem
        label="Особенности настройки"
        :name="['attunement', 'description']"
      >
        <AInput
          v-model:value="description"
          :disabled="!attunement.requires"
          placeholder="Введи особенности настройки (если есть)"
          allow-clear
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
