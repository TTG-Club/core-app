<script setup lang="ts">
  import { SpeedType } from '~bestiary/types';
  import type { CreateSpeed, CreateSpeeds } from '~bestiary/types';
  import { EditorArrayControls } from '~ui/editor';

  const model = defineModel<CreateSpeeds>({
    required: true,
  });

  function getEmpty(key: SpeedType) {
    const empty: CreateSpeed = {
      value: 0,
      text: undefined,
    };

    if (key === SpeedType.FLY) {
      empty.hover = false;
    }

    return empty;
  }

  function getDividerContent(key: SpeedType) {
    switch (key) {
      case SpeedType.FLY:
        return 'Скорость полета';
      case SpeedType.CLIMB:
        return 'Скорость лазания';
      case SpeedType.SWIM:
        return 'Скорость плавания';
      case SpeedType.BURROW:
        return 'Скорость копания';
      default:
        return 'Скорость передвижения';
    }
  }

  function createFirstSpeed(key: SpeedType) {
    if (!model.value[key]) {
      model.value[key] = [];
    }

    model.value[key].push(getEmpty(key));
  }
</script>

<template>
  <template
    v-for="key in SpeedType"
    :key
  >
    <USeparator>
      <span class="font-bold text-secondary">{{ getDividerContent(key) }}</span>
    </USeparator>

    <UForm
      v-for="(item, index) in model[key]"
      :key="index"
      class="col-span-full grid grid-cols-24 gap-4"
      attach
      :state="item"
    >
      <UFormField
        class="col-span-6"
        label="Скорость"
        :name="`${key}.${index}.value`"
      >
        <UInputNumber
          v-model="item.value"
          :precision="0"
          placeholder="Введи скорость"
          :min="0"
        >
          <template #trailing> фт. </template>
        </UInputNumber>
      </UFormField>

      <UFormField
        v-if="key === 'fly'"
        class="col-span-2"
        label="Парит"
        :name="`${key}.${index}.hover`"
      >
        <UCheckbox
          v-model="item.hover"
          label="Да"
        />
      </UFormField>

      <UFormField
        :class="key !== 'fly' ? 'col-span-12' : 'col-span-10'"
        label="Пояснение к скорости"
        :name="`${key}.${index}.text`"
      >
        <UInput
          v-model="item.text"
          placeholder="Например, только в форме медведя"
        />
      </UFormField>

      <EditorArrayControls
        v-model="model[key]"
        :only-remove="key !== SpeedType.WALK"
        :empty-object="getEmpty(key)"
        :index
        :item
      />
    </UForm>

    <div
      v-if="!model[key]?.length"
      class="col-span-full flex justify-center"
    >
      <UButton @click.left.exact.prevent="createFirstSpeed(key)">
        Добавить первую
      </UButton>
    </div>
  </template>
</template>
