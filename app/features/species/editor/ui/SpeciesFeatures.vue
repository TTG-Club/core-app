<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';

  import type { SpeciesCreate } from '~/shared/types';

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

  function isLastFeature(index: number) {
    return index === model.value.length - 1;
  }

  function addFeature(indexOfNewFeature: number) {
    model.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }

  function removeFeature(index: number) {
    model.value.splice(index, 1);
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      content="Умения"
      type="secondary"
      strong
    />
  </ADivider>

  <template
    v-for="(feature, featIndex) in model"
    :key="featIndex"
  >
    <ARow :gutter="16">
      <ACol :span="8">
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

      <ACol :span="8">
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

      <ACol :span="8">
        <AFormItem label="Управление">
          <ARow :gutter="16">
            <ACol :span="12">
              <AButton
                block
                @click.left.exact.prevent="addFeature(featIndex + 1)"
              >
                Добавить умение
              </AButton>
            </ACol>

            <ACol :span="12">
              <AButton
                danger
                block
                @click.left.exact.prevent="removeFeature(featIndex)"
              >
                Удалить умение
              </AButton>
            </ACol>
          </ARow>
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

    <ADivider v-if="!isLastFeature(featIndex)" />
  </template>

  <AFlex
    v-if="!model.length"
    justify="center"
  >
    <AButton @click.left.exact.prevent="addFeature(0)">
      Добавить первое умение
    </AButton>
  </AFlex>
</template>
