<script setup lang="ts">
  import {
    type CreateSpeed,
    type CreateSpeeds,
    SpeedType,
  } from '~bestiary/types';
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
        return 'Скорость ползания';
      case SpeedType.SWIM:
        return 'Скорость плавания';
      case SpeedType.BURROW:
        return 'Скорость копания';
      default:
        return 'Скорость передвижения';
    }
  }
</script>

<template>
  <template
    v-for="key in SpeedType"
    :key
  >
    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        :content="getDividerContent(key)"
        strong
      />
    </ADivider>

    <ARow
      v-for="(item, index) in model[key]"
      :key="index"
      :gutter="16"
    >
      <ACol :span="6">
        <AFormItem
          label="Скорость"
          :name="['speeds', key, index, 'value']"
        >
          <AInputNumber
            v-model:value="item.value"
            :precision="0"
            placeholder="Введи скорость"
            min="0"
          >
            <template #addonAfter> фт. </template>
          </AInputNumber>
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="Пояснение к скорости"
          :name="['speeds', key, index, 'text']"
        >
          <AInput
            v-model:value="item.text"
            placeholder="Например, только в форме медведя"
          />
        </AFormItem>
      </ACol>

      <EditorArrayControls
        v-model="model[key]"
        :only-remove="key !== SpeedType.WALK"
        :empty-object="getEmpty(key)"
        :index
        :item
      />
    </ARow>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFlex
          v-if="!model[key]?.length"
          justify="center"
        >
          <AButton @click.left.exact.prevent="model[key].push(getEmpty(key))">
            Добавить первую
          </AButton>
        </AFlex>
      </ACol>
    </ARow>
  </template>
</template>
