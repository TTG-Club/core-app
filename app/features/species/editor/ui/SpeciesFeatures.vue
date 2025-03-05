<script setup lang="ts">
  import type { SpeciesCreate } from '~/shared/types';
  import { isEqual } from 'lodash-es';
  import { ValidationBase } from '~/shared/utils';

  type Features = SpeciesCreate['features'];

  function getEmptyFeature(): Features[number] {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
    };
  }

  const model = defineModel<Features>({
    default: () => [],
  });

  function isFeatureEmpty(feat: Features[number]) {
    return isEqual(feat, getEmptyFeature());
  }

  function isLastFeature(index: number) {
    return index === model.value.length - 1;
  }

  function addFeature(indexOfNewFeature: number) {
    model.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }

  function clearFeature(index: number) {
    model.value.splice(index, 1, getEmptyFeature());
  }

  function removeFeature(index: number) {
    model.value.splice(index, 1);
  }

  watch(
    model,
    (value) => {
      if (!value.length) {
        model.value.push(getEmptyFeature());
      }
    },
    {
      immediate: true,
      flush: 'pre',
    },
  );
</script>

<template>
  <template
    v-for="(feature, featIndex) in model"
    :key="featIndex"
  >
    <ARow :gutter="16">
      <ACol :span="12">
        <AFormItem
          label="Название"
          :name="['features', featIndex, 'name', 'rus']"
          :rules="[ValidationBase.ruleRusName()]"
        >
          <AInput
            v-model:value="feature.name.rus"
            placeholder="Введи название"
          />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="Название (англ.)"
          tooltip="Английское название"
          :name="['features', featIndex, 'name', 'eng']"
          :rules="[ValidationBase.ruleEngName()]"
        >
          <AInput
            v-model:value="feature.name.eng"
            placeholder="Введи английское название"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow>
      <ACol :span="24">
        <AFormItem
          label="Описание"
          :name="['features', featIndex, 'description']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="feature.description"
            :auto-size="{ minRows: 3, maxRows: 8 }"
            placeholder="Введи описание"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <AFlex
      justify="flex-end"
      :gap="16"
    >
      <AFlex :gap="8">
        <AButton @click.left.exact.prevent="addFeature(featIndex + 1)">
          Добавить особенность
        </AButton>

        <AButton
          v-if="isLastFeature(featIndex)"
          :disabled="isFeatureEmpty(feature)"
          danger
          @click.left.exact.prevent="clearFeature(featIndex)"
        >
          Очистить особенность
        </AButton>

        <AButton
          v-else
          danger
          @click.left.exact.prevent="removeFeature(featIndex)"
        >
          Удалить особенность
        </AButton>
      </AFlex>
    </AFlex>

    <ADivider v-if="!isLastFeature(featIndex)" />
  </template>
</template>
