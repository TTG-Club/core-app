<script setup lang="ts">
  import type { FeatCreate } from '~/shared/types';
  import {
    ValidationBase,
    ValidationFeat,
    ValidationDictionaries,
  } from '~/shared/utils';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { FormInstance } from 'ant-design-vue';

  import { NuxtLink } from '#components';
  import { SelectFeatCategory, SelectSource, SelectTags } from '~ui/select';
  import { InputUrl } from '~ui/input';
  import { EditorActions } from '~ui/editor';
  import { useToast } from '~ui/toast';

  const $toast = useToast();

  const formRef = useTemplateRef<FormInstance>('formRef');

  const form = ref<FeatCreate>({
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    source: {
      url: undefined,
      page: undefined,
    },
    prerequisite: '',
    description: '',
    category: undefined,
    repeatability: false,
    tags: [],
  });

  const handleBookChange = (value: SelectValue) => {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      form.value.source.page = undefined;
    }

    form.value.source.url = value;
  };

  const isCreating = ref(false);
  const isCreated = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await formRef.value?.validate();

      await $fetch<string>('/api/v2/feats', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          $toast.error({
            title: 'Ошибка создания черты',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      $toast.success({
        title: 'Черта успешно создана',
        description: () =>
          h('span', [
            'Можешь перейти на нее ',
            h(
              NuxtLink,
              {
                to: {
                  name: 'feats-url',
                  params: {
                    url: form.value.url,
                  },
                },
                target: '_blank',
              },
              () => 'страницу',
            ),
          ]),
        // onClose: () => navigateTo({ name: 'workshop-feats' }), // TODO: вернуть в будущем
      });
    } catch (err) {
      isCreating.value = false;
    } finally {
      isCreating.value = false; // TODO: удалить в будущем
    }
  };
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
          :rules="[ValidationFeat.ruleUrl()]"
        >
          <InputUrl
            v-model="form.url"
            :eng-name="form.name.eng"
            :source-url="form.source.url"
            :addon-before="`${getOrigin()}/feats/`"
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
      <ACol :span="6">
        <AFormItem
          label="Категория"
          :name="['category']"
          :rules="[ValidationDictionaries.ruleFeatCategories()]"
        >
          <SelectFeatCategory v-model="form.category" />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="Предварительное условие"
          :name="['prerequisite']"
        >
          <AInput
            v-model:value="form.prerequisite"
            placeholder="Введи предварительное условие если есть"
            allow-clear
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Повторяемость"
          :name="['repeatability']"
        >
          <ACheckbox v-model:checked="form.repeatability">
            Можно брать несколько раз
          </ACheckbox>
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

  <EditorActions
    :is-submitting="isCreating"
    :disabled="isCreated"
    :submit
  />
</template>
