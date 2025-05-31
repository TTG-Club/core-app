<script setup lang="ts">
  import type { SpeciesCreateSpeed } from '~/shared/types';

  const speed = defineModel<SpeciesCreateSpeed>({ required: true });
</script>

<template>
  <ARow :gutter="16">
    <ACol :span="6">
      <AFormItem
        label="Скорость передвижения"
        :name="['properties', 'speed', 'base']"
      >
        <AInputNumber
          v-model:value="speed.base"
          :precision="0"
          placeholder="Введи скорость передвижения"
          min="0"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <ARow :gutter="16">
        <ACol :span="16">
          <AFormItem
            label="Скорость полета"
            :name="['properties', 'speed', 'fly']"
          >
            <AInputNumber
              v-model:value="speed.fly"
              :precision="0"
              placeholder="Введи скорость полета"
              min="0"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Парит"
            :name="['properties', 'speed', 'hover']"
          >
            <ACheckbox v-model:checked="speed.hover"> Да </ACheckbox>
          </AFormItem>
        </ACol>
      </ARow>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Скорость лазания"
        :name="['properties', 'speed', 'climb']"
      >
        <AInputNumber
          v-model:value="speed.climb"
          :precision="0"
          placeholder="Введи скорость лазания"
          min="0"
        />
      </AFormItem>
    </ACol>

    <ACol :span="6">
      <AFormItem
        label="Скорость плавания"
        :name="['properties', 'speed', 'swim']"
      >
        <AInputNumber
          v-model:value="speed.swim"
          :precision="0"
          placeholder="Введи скорость плавания"
          min="0"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
