<script setup lang="ts">
  import { SelectRarity } from './ui';

  import { ValidationDictionaries } from '~/shared/utils';

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
  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Редкость"
        :name="['rarity', 'type']"
        :rules="[ValidationDictionaries.ruleRarity()]"
      >
        <SelectRarity
          v-model="model.type"
          placeholder="Выбери редкость"
        />
      </AFormItem>
    </ACol>

    <ACol :span="16">
      <AFormItem
        label="Текст редкости"
        :name="['rarity', 'varies']"
      >
        <AInput
          v-model:value="model.varies"
          :disabled="!isVaries"
          placeholder="Введи текст для варьируемой редкости"
          allow-clear
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
