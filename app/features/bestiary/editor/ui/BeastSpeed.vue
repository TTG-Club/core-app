<script setup lang="ts">
  import type { CreateSpeeds } from '~bestiary/types';

  const model = defineModel<CreateSpeeds>({
    required: true,
  });
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="4">
      <AFormItem
        label="Скорость"
        :name="['speed', 'walk', 'value']"
      >
        <AInputNumber
          v-model:value="model.walk.value"
          :precision="0"
          min="0"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <ARow :gutter="16">
        <ACol :span="16">
          <AFormItem
            label="Скорость полета"
            :name="['speed', 'fly', 'value']"
          >
            <AInputNumber
              v-model:value="model.fly.value"
              :precision="0"
              min="0"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Парит"
            :name="['speed', 'fly', 'hover']"
          >
            <ACheckbox v-model:checked="model.fly.hover"> Да </ACheckbox>
          </AFormItem>
        </ACol>
      </ARow>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Скорость лазания"
        :name="['speed', 'climb', 'value']"
      >
        <AInputNumber
          v-model:value="model.climb.value"
          :precision="0"
          min="0"
        />
      </AFormItem>
    </ACol>

    <ACol :span="4">
      <AFormItem
        label="Скорость плавания"
        :name="['speed', 'swim', 'value']"
      >
        <AInputNumber
          v-model:value="model.swim.value"
          :precision="0"
          min="0"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Скорость копания"
        :name="['speed', 'swim', 'value']"
      >
        <AInputNumber
          v-model:value="model.burrow.value"
          :precision="0"
          min="0"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
