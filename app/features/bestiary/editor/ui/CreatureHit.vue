<script setup lang="ts">
  import type { CreatureCreate } from '~bestiary/types';

  const model = defineModel<CreatureCreate>({
    required: true,
  });
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Среднее количество хитов"
        :name="['hit', 'hit']"
      >
        <AInputNumber
          v-model:value="model.hit.hit"
          placeholder="Введи количество хитов"
          min="1"
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Костей хитов"
        :name="['hit', 'countHitDice']"
      >
        <AInputNumber
          v-model:value="model.hit.countHitDice"
          placeholder="Введи количество костей хитов"
          min="0"
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem label="Формула">
        <AInput
          v-model:value="model.hit.formula"
          disabled
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Текстовое описание"
        :name="['hit', 'text']"
      >
        <AInput
          v-model:value="model.hit.text"
          placeholder="Текстовое описани хитов"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
