<script setup lang="ts">
  import { ValidationDictionaries } from '~/shared/utils';
  import { SelectRarity } from '~magic-items/editor/ui/index';

  const rarity = defineModel<string>('rarity', {
    required: true,
  });

  const varies = defineModel<string | undefined>('varies', {
    required: true,
  });

  const isVaries = computed(() => rarity.value == 'VARIES');
</script>

<template>
  <ACol :span="4">
    <AFormItem
      label="Редкость"
      :name="['rarity']"
      :rules="[ValidationDictionaries.ruleRarity()]"
    >
      <SelectRarity
        v-model="rarity"
        placeholder="Выбери редкость"
      />
    </AFormItem>
  </ACol>

  <ACol
    v-if="isVaries"
    :span="20"
  >
    <AFormItem
      label="Текст редкости"
      :name="['varies']"
    >
      <AInput
        v-model:value="varies"
        placeholder="Введи текст для варьеативной редкости"
        allow-clear
      />
    </AFormItem>
  </ACol>
</template>
