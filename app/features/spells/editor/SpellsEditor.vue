<script setup lang="ts">
  import type { SpellCreate } from '~/shared/types';
  import {
    ValidationBase,
    ValidationSpell,
    ValidationDictionaries,
  } from '~/shared/utils';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { FormInstance } from 'ant-design-vue';

  import {
    SpellCastingTimes,
    SpellRanges,
    SpellDurations,
    SpellComponents,
  } from './ui';
  import { NuxtLink } from '#components';
  import {
    SelectMagicSchool,
    SelectSource,
    SelectSpecies,
    SelectTags,
  } from '~ui/select';
  import { InputUrl } from '~ui/input';
  import { EditorActions } from '~ui/editor';

  const siteConfig = useSiteConfig();
  const { notification } = App.useApp();

  const formRef = useTemplateRef<FormInstance>('formRef');

  const form = ref<SpellCreate>({
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
    description: '',
    upper: undefined,
    level: 0,
    school: undefined,
    range: [],
    duration: [],
    castingTime: [],
    components: {
      v: false,
      s: false,
      m: undefined,
    },
    affiliations: {
      classes: [],
      subclasses: [],
      species: [],
      lineages: [],
    },
    tags: [],
  });

  const spellLevels = Array.from(Array(10)).map((_, index) => ({
    label: !index ? 'Заговор' : `${index} круг`,
    value: index,
  }));

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

      await $fetch<string>('/api/v2/spells', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          notification.error({
            message: 'Ошибка создания заклинания',
            description: error.response._data.message,
          });
        },
      });

      // isCreated.value = true; // TODO: вернуть в будущем

      notification.success({
        message: 'Заклинание успешно создано',
        description: () =>
          h('span', [
            'Можешь перейти на его ',
            h(
              NuxtLink,
              {
                to: {
                  name: 'spells-url',
                  params: {
                    url: form.value.url,
                  },
                },
                target: '_blank',
              },
              () => 'страницу',
            ),
          ]),
        // onClose: () => navigateTo({ name: 'workshop-spells' }), // TODO: вернуть в будущем
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
          :rules="[ValidationSpell.ruleUrl()]"
        >
          <InputUrl
            v-model="form.url"
            :eng-name="form.name.eng"
            :source-url="form.source.url"
            :addon-before="`${siteConfig.url}/spells/`"
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ACol :span="12">
        <AFormItem
          label="Уровень заклинания"
          :name="['level']"
        >
          <ASelect
            v-model:value="form.level"
            placeholder="Выбери уровень"
            :options="spellLevels"
          />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="Школа"
          :name="['school']"
          :rules="[ValidationDictionaries.ruleMagicSchool()]"
        >
          <SelectMagicSchool v-model="form.school" />
        </AFormItem>
      </ACol>
    </ARow>

    <SpellCastingTimes v-model="form.castingTime" />

    <SpellRanges v-model="form.range" />

    <SpellComponents v-model="form.components" />

    <SpellDurations v-model="form.duration" />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Описание"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="12">
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

      <ACol :span="12">
        <AFormItem
          label="На более высоких уровнях"
          :name="['upper']"
        >
          <ATextarea
            v-model:value="form.upper"
            :rows="8"
            placeholder="Введи описание"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Принадлежность"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="6">
        <AFormItem
          label="Классы"
          :name="['affiliations', 'classes']"
        >
          <SelectSpecies
            v-model="form.affiliations.classes"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Архетипы"
          :name="['affiliations', 'subclasses']"
        >
          <SelectSpecies
            v-model="form.affiliations.subclasses"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Виды"
          :name="['affiliations', 'species']"
        >
          <SelectSpecies
            v-model="form.affiliations.species"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Происхождения"
          :name="['affiliations', 'lineages']"
        >
          <SelectSpecies
            v-model="form.affiliations.lineages"
            multiple
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
