<script setup lang="ts">
  import { ruleUrl } from './validations';

  import { ValidationBase } from '~/shared/utils';
  import { InputUrl } from '~ui/input';
  import { SelectSource, SelectTags } from '~ui/select';

  import type { EditorBaseInfoState } from './types';
  import type { SelectValue } from 'ant-design-vue/es/select';

  defineProps<{
    section: string;
  }>();

  const {
    params: { url: oldUrl },
  } = useRoute();

  const form = defineModel<EditorBaseInfoState>({ required: true });

  function handleBookChange(value: SelectValue) {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      form.value.source.page = undefined;
    }

    form.value.source.url = value;
  }
</script>

<template>
  <ADivider orientation="left">
    <ATypographyText
      type="secondary"
      content="Основная информация"
      strong
    />
  </ADivider>

  <ARow :gutter="16">
    <ACol :span="8">
      <AFormItem
        label="Название"
        :name="['name', 'rus']"
        :rules="[ValidationBase.ruleRusName()]"
      >
        <AInput
          v-model:value="form.name.rus"
          placeholder="Введи название"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Название (англ.)"
        tooltip="Английское название"
        :name="['name', 'eng']"
        :rules="[ValidationBase.ruleEngName()]"
      >
        <AInput
          v-model:value="form.name.eng"
          placeholder="Введи английское название"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Название (альт.)"
        tooltip="Альтернативные названия. Используется для поиска и СЕО."
        :name="['name', 'alt']"
      >
        <SelectTags
          v-model="form.name.alt"
          placeholder="Введи альтернативные названия"
        />
      </AFormItem>
    </ACol>
  </ARow>

  <ARow :gutter="16">
    <ACol :span="16">
      <AFormItem
        label="Источник"
        tooltip="Книга, из которой взята информация о виде, если она существует"
        :name="['source', 'url']"
      >
        <SelectSource
          :model-value="form.source.url"
          @update:model-value="handleBookChange"
        />
      </AFormItem>
    </ACol>

    <ACol :span="8">
      <AFormItem
        label="Страница в источнике"
        tooltip="Номер страницы книги, откуда была взята информация о виде, если выбрана сама книга"
        :name="['source', 'page']"
        :rules="[ValidationBase.ruleSourcePage(!!form.source.url)]"
      >
        <AInputNumber
          v-model:value="form.source.page"
          :disabled="!form.source.url"
          :precision="0"
          placeholder="Введи номер страницы"
          min="0"
        />
      </AFormItem>
    </ACol>
  </ARow>

  <ARow :gutter="16">
    <ACol :span="12">
      <AFormItem
        label="Теги"
        tooltip="Используются для поиска и СЕО"
        :name="['tags']"
      >
        <SelectTags
          v-model="form.tags"
          placeholder="Введи теги"
        />
      </AFormItem>
    </ACol>

    <ACol :span="12">
      <AFormItem
        label="URL"
        tooltip="Менять только при необходимости, т.к. URL генерируется автоматически при вводе английского названия"
        :name="['url']"
        :rules="[ruleUrl(section, oldUrl)]"
      >
        <InputUrl
          v-model="form.url"
          :eng-name="form.name.eng"
          :source-url="form.source.url"
          :addon-before="`${getOrigin()}/${section}/`"
        />
      </AFormItem>
    </ACol>
  </ARow>
</template>
