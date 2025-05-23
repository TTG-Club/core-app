<script setup lang="ts">
  import { ValidationBase, ValidationBackground } from '~/shared/utils';
  import { InputUrl } from '~ui/input';
  import {
    SelectAbilities,
    SelectFeat,
    SelectSkill,
    SelectSource,
    SelectTags,
  } from '~ui/select';

  import type { FormInstance } from 'ant-design-vue';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { BackgroundCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<BackgroundCreate>({ required: true });

  const {
    params: { url: oldUrl },
  } = useRoute();

  const formRef = useTemplateRef<FormInstance>('formRef');

  const handleBookChange = (value: SelectValue) => {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      form.value.source.page = undefined;
    }

    form.value.source.url = value;
  };

  defineExpose({
    validate: computed(() => formRef.value?.validate),
  });
</script>

<template>
  <AForm
    ref="formRef"
    layout="vertical"
    :model="form"
    :disabled="isCreating"
  >
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
          :rules="[ValidationBackground.ruleUrl(oldUrl)]"
        >
          <InputUrl
            v-model="form.url"
            :eng-name="form.name.eng"
            :source-url="form.source.url"
            :addon-before="`${getOrigin()}/backgrounds/`"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Подробности"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Характеристики"
          tooltip="В предыстории перечислены 3 из ваших характеристик персонажа. Увеличьте одну из них на 2, а другую на 1; или увеличьте каждую из 3 на 1."
          :name="['abilityScores']"
        >
          <SelectAbilities
            v-model="form.abilityScores"
            :limit="3"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Навыки"
          tooltip="Предыстория даёт вашему персонажу владение двумя определёнными навыками."
          :name="['skillsProficiencies']"
        >
          <SelectSkill
            v-model="form.skillsProficiencies"
            :limit="2"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Черта"
          tooltip=""
          :name="['featUrl']"
        >
          <SelectFeat v-model="form.featUrl" />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Владение инструментами"
          :name="['toolProficiency']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="form.toolProficiency"
            :rows="3"
            placeholder="Введи инструменты"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Снаряжение"
          :name="['equipment']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="form.equipment"
            :rows="3"
            placeholder="Введи снаряжение"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Описание"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Описание"
          :name="['description']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="form.description"
            :rows="8"
            placeholder="Введи описание"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
