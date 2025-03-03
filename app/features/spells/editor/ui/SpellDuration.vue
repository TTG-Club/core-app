<script setup lang="ts">
  import { SelectTimeUnit } from '~/shared/ui';
  import type { SpellDuration } from '~/shared/types';
  import { Form } from 'ant-design-vue';

  const context = Form.useInjectFormItemContext();

  const model = defineModel<SpellDuration>({
    default: (): SpellDuration => ({
      unit: undefined,
      value: undefined,
      custom: undefined,
    }),
  });

  const isDefaultDisabled = computed(() => !!model.value.custom);

  const isCustomDisabled = computed(
    () => !!model.value.value || !!model.value.unit,
  );

  watch(model, () => {
    context.onFieldChange();
  });
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Длительность"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Длительность"
        :name="['duration', 'value']"
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
        label="Единица времени"
        :name="['duration', 'unit']"
      >
        <SelectTimeUnit
          v-model="model.unit"
          :disabled="isDefaultDisabled"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Собственное значение"
        :name="['duration', 'custom']"
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
