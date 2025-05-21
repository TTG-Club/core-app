<script setup lang="ts">
  import type { CreateAbilities } from '~bestiary/types';

  const model = defineModel<CreateAbilities>({
    required: true,
  });

  function modifier(value?: number): number {
    return value != null ? Math.floor((value - 10) / 2) : 0;
  }

  function formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Сила"
        :name="['abilities', 'str', 'value']"
      >
        <AInputNumber
          v-model:value="model.str.value"
          :precision="0"
          min="0"
          max="30"
          :addon-after="formatModifier(modifier(model.str.value))"
        >
          <template #addonBefore>
            <ASelect>
              <ASelectOption>БМ</ASelectOption>

              <ASelectOption>2БМ</ASelectOption>
            </ASelect>
          </template>
        </AInputNumber>
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Ловкость"
        :name="['speed', 'fly', 'value']"
      >
        <AInputNumber
          v-model:value="model.dex.value"
          :precision="0"
          :addon-after="formatModifier(modifier(model.dex.value))"
          min="0"
          max="30"
        >
          <template #addonBefore>
            <ASelect>
              <ASelectOption>БМ</ASelectOption>

              <ASelectOption>2БМ</ASelectOption>
            </ASelect>
          </template></AInputNumber
        >
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Телосложение"
        :name="['speed', 'climb', 'value']"
      >
        <AInputNumber
          v-model:value="model.con.value"
          :addon-after="formatModifier(modifier(model.con.value))"
          :precision="0"
          min="0"
          max="30"
        >
          <template #addonBefore>
            <ASelect>
              <ASelectOption>БМ</ASelectOption>

              <ASelectOption>2БМ</ASelectOption>
            </ASelect>
          </template></AInputNumber
        >
      </AFormItem>
    </ACol>
  </ARow>

  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Интеллект"
        :name="['speed', 'swim', 'value']"
      >
        <AInputNumber
          v-model:value="model.int.value"
          :addon-after="formatModifier(modifier(model.int.value))"
          :precision="0"
          min="0"
          max="30"
        >
          <template #addonBefore>
            <ASelect>
              <ASelectOption>БМ</ASelectOption>

              <ASelectOption>2БМ</ASelectOption>
            </ASelect>
          </template></AInputNumber
        >
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Мудрость"
        :name="['speed', 'swim', 'value']"
      >
        <AInputNumber
          v-model:value="model.wis.value"
          :addon-after="formatModifier(modifier(model.wis.value))"
          :precision="0"
          min="0"
          max="30"
        >
          <template #addonBefore>
            <ASelect>
              <ASelectOption>БМ</ASelectOption>

              <ASelectOption>2БМ</ASelectOption>
            </ASelect>
          </template></AInputNumber
        >
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Харизма"
        :name="['speed', 'swim', 'value']"
      >
        <AInputNumber
          v-model:value="model.chr.value"
          :addon-after="formatModifier(modifier(model.chr.value))"
          :precision="0"
          min="0"
          max="30"
        >
          <template #addonBefore>
            <ASelect>
              <ASelectOption>БМ</ASelectOption>

              <ASelectOption>2БМ</ASelectOption>
            </ASelect>
          </template></AInputNumber
        >
      </AFormItem>
    </ACol>
  </ARow>
</template>
