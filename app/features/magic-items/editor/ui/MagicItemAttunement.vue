<script setup lang="ts">
  import type { Attunement } from '~magic-items/types';

  const attunement = defineModel<Attunement>({
    required: true,
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
          v-model:value="attunement.description"
          :disabled="!attunement.requires"
          placeholder="Введи особенности настройки (если есть)"
          allow-clear
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
