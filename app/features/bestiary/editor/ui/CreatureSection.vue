<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';
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
      >
        <AInput
          v-model:value="model.name.rus"
          :placeholder="`Например, Неумолимый страж Нижних планов`"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Название секции (англ.)"
        :name="['section', 'name', 'rus']"
      >
        <AInput
          v-model:value="model.name.eng"
          :placeholder="`Например, Неумолимый страж Нижних планов`"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Подзаголовок"
        :name="['section', 'subtitle']"
      >
        <AInput
          v-model:value="model.subtitle"
          :placeholder="`Например, Неумолимый страж Нижних планов`"
        />
      </AFormItem>
    </ACol>
  </ARow>

  <ARow :gutter="16">
    <ACol :span="12">
      <AFormItem
        label="Среда обитания"
        :name="['section', 'habitats']"
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
