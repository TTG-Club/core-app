<script setup lang="ts">
  import type { CreatureSenses } from '~bestiary/types';

  const model = defineModel<CreatureSenses>({ required: true });

  const senseTypes = [
    { label: 'Тёмное зрение', value: 'DARKVISION' },
    { label: 'Истинное зрение', value: 'TRUESIGHT' },
    { label: 'Слепое зрение', value: 'BLINDSIGHT' },
    { label: 'Чувство вибрации', value: 'TREMORSENSE' },
  ];

  // Получить значение чувства по типу
  function getSenseValue(type: string): number | undefined {
    return model.value.senses.find((s) => s.type === type)?.value;
  }

  // Обновить или добавить чувство
  function updateSense(type: string, value: number | undefined) {
    const existing = model.value.senses.find((s) => s.type === type);

    if (value == null || Number.isNaN(value)) {
      if (existing) {
        model.value.senses = model.value.senses.filter((s) => s.type !== type);
      }
    } else {
      if (existing) {
        existing.value = value;
      } else {
        model.value.senses.push({ type, value });
      }
    }
  }
</script>

<template>
  <ARow :gutter="16">
    <ACol
      v-for="sense in senseTypes"
      :key="sense.value"
      :span="4"
    >
      <AFormItem
        :label="sense.label"
        :name="['senses', sense.value]"
      >
        <AInputNumber
          :value="getSenseValue(sense.value)"
          :min="0"
          :precision="0"
          placeholder="Введите значение"
          @update:value="
            (v) =>
              updateSense(sense.value, typeof v === 'number' ? v : undefined)
          "
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Пассивная Внимательность"
        :name="['senses', 'passivePerception']"
      >
        <AInputNumber
          v-model:value="model.passivePerception"
          :min="0"
          :precision="0"
          placeholder="Введите значение"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
