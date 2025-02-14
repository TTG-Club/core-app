<script setup lang="ts">
  import { SelectDistanceType } from '~/shared/ui';
  import type { SpellDistance } from '~/shared/types';

  const model = defineModel<SpellDistance>({
    default: (): SpellDistance => ({
      unit: undefined,
      value: undefined,
      custom: undefined,
    }),
  });

  const isDefaultDisabled = computed(() => !!model.value.custom);

  const isCustomDisabled = computed(
    () => !!model.value.value || !!model.value.unit,
  );
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Дистанция"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Дистанция"
        :name="['distance', 'value']"
      >
        <AInputNumber
          v-model:value="model.value"
          :disabled="isDefaultDisabled"
          :precision="0"
          :min="0"
          placeholder="Введи значение"
          allow-clear
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Единицы дистанции"
        :name="['distance', 'unit']"
      >
        <SelectDistanceType
          v-model="model.unit"
          :disabled="isDefaultDisabled"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Собственное значение"
        :name="['distance', 'custom']"
      >
        <AInput
          v-model:value="model.custom"
          :disabled="isCustomDisabled"
          placeholder="Введи значение"
          allow-clear
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
