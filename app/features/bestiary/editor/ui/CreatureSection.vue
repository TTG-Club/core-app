<script setup lang="ts">
  import { ValidationBase, ValidationDictionaries } from '~/shared/utils';
  import { SelectHabitat, SelectTreasure } from '~ui/select';

  import type { CreatureSection } from '~bestiary/types';

  const model = defineModel<CreatureSection>({ required: true });
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Секция"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Название секции"
        :name="['section', 'name', 'rus']"
        :rules="[ValidationBase.ruleRusName(false)]"
        tooltip="Например, Золотые драконы"
      >
        <AInput
          v-model:value="model.name.rus"
          placeholder="Введи название секции"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Название секции (англ.)"
        :name="['section', 'name', 'eng']"
        :rules="[ValidationBase.ruleEngName(false)]"
        tooltip="Например, Gold Dragons"
      >
        <AInput
          v-model:value="model.name.eng"
          placeholder="Введи название секции"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Подзаголовок"
        :name="['section', 'subtitle']"
        :rules="[ValidationBase.ruleString(false)]"
        tooltip="Например, Драконы надежды и величия"
      >
        <AInput
          v-model:value="model.subtitle"
          placeholder="Введи подзаголовок"
        />
      </AFormItem>
    </ACol>
  </ARow>

  <ARow :gutter="16">
    <ACol :span="12">
      <AFormItem
        label="Среда обитания"
        :name="['section', 'habitats']"
        :rules="[
          ValidationDictionaries.ruleHabitats({
            required: false,
            array: true,
          }),
        ]"
      >
        <SelectHabitat
          v-model="model.habitats"
          multiple
        />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem
        label="Сокровища"
        :name="['section', 'treasures']"
        :rules="[
          ValidationDictionaries.ruleTreasures({
            required: false,
            array: true,
          }),
        ]"
      >
        <SelectTreasure
          v-model="model.treasures"
          multiple
        />
      </AFormItem>
    </ACol>
  </ARow>

  <ARow :gutter="16">
    <ACol :span="24">
      <AFormItem
        label="Описание секции"
        :name="['section', 'description']"
        :rules="[ValidationBase.ruleString(false)]"
      >
        <ATextarea
          v-model:value="model.description"
          :rows="8"
          placeholder="Введи описание"
          allow-clear
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
