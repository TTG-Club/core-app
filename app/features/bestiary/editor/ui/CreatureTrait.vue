<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';

  import type { CreatureCreate, CreateTrait } from '~bestiary/types';

  type Traits = CreatureCreate['traits'];

  function getEmptyFeature(): Traits[number] {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
    };
  }

  const model = defineModel<Array<CreateTrait>>({
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
      content="Особенности"
      type="secondary"
      strong
    />
  </ADivider>

  <template
    v-for="(trait, featIndex) in model"
    :key="featIndex"
  >
    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Название"
          :name="['traits', featIndex, 'name', 'rus']"
          :rules="[ValidationBase.ruleRusName()]"
        >
          <AInput
            v-model:value="trait.name.rus"
            placeholder="Введи название"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Название (англ.)"
          tooltip="Английское название"
          :name="['traits', featIndex, 'name', 'eng']"
          :rules="[ValidationBase.ruleEngName()]"
        >
          <AInput
            v-model:value="trait.name.eng"
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
                Добавить особенность
              </AButton>
            </ACol>

            <ACol :span="12">
              <AButton
                danger
                block
                @click.left.exact.prevent="removeFeature(featIndex)"
              >
                Удалить особенность
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
          :name="['traits', featIndex, 'description']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="trait.description"
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
