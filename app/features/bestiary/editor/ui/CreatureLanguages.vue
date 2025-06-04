<script setup lang="ts">
  import { ValidationDictionaries } from '~/shared/utils';
  import { EditorArrayControls } from '~ui/editor';
  import { SelectLanguage } from '~ui/select';

  import type { CreateLanguage, CreatureLanguages } from '~bestiary/types';

  const model = defineModel<CreatureLanguages>({ required: true });

  function getEmpty(): CreateLanguage {
    return {
      language: undefined,
      text: undefined,
    };
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Языки"
      strong
    />
  </ADivider>

  <ARow
    v-for="(item, index) in model.values"
    :key="index"
    :gutter="16"
  >
    <ACol :span="6">
      <AFormItem
        label="Язык"
        :name="['languages', 'values', index, 'language']"
        :rules="[ValidationDictionaries.ruleLanguage()]"
      >
        <SelectLanguage v-model="item.language" />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem
        label="Пояснение"
        :name="['languages', 'values', index, 'text']"
      >
        <AInput
          v-model:value="item.text"
          :placeholder="`Например, только понимает или древний диалект`"
        />
      </AFormItem>
    </ACol>

    <EditorArrayControls
      v-model="model.values"
      :empty-object="getEmpty()"
      :index
      :item
      only-remove
    />
  </ARow>

  <AFlex
    v-if="!model.values?.length"
    :style="{ marginBottom: '24px' }"
    justify="center"
  >
    <AButton @click.left.exact.prevent="model.values.push(getEmpty())">
      Добавить первый
    </AButton>
  </AFlex>

  <ARow :gutter="16">
    <ACol :span="12">
      <AFormItem
        label="Телепатия"
        :name="['languages', 'telepathy']"
      >
        <AInput
          v-model:value="model.telepathy"
          placeholder="Например, 60 футов"
        />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem
        label="Доп. описание"
        :name="['languages', 'text']"
      >
        <AInput
          v-model:value="model.text"
          placeholder="Например, понимает язык природы"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
