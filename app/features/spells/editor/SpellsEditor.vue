<script setup lang="ts">
  import {
    SvgIcon,
    SelectSource,
    SelectTags,
    SelectMagicSchool,
    SelectSpecie,
    PageHeader,
    PageContainer,
    InputUrl,
    EditorActions,
  } from '~/shared/ui';
  import type { SpellCreate } from '~/shared/types';
  import {
    ValidationBase,
    ValidationSpell,
    ValidationDictionaries,
  } from '~/shared/utils';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { FormInstance } from 'ant-design-vue';

  import {
    CastingTimes,
    MaterialComponents,
    SpellDistance,
    SpellDuration,
  } from './ui';

  const siteConfig = useSiteConfig();

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
    ritual: false,
    concentration: false,
    range: [],
    duration: [],
    castingTime: [],
    components: {
      v: false,
      s: false,
      m: {
        text: undefined,
        withCost: false,
        consumable: false,
      },
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

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await formRef.value?.validate();

      await $fetch('/api/v2/spells/new', {
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
    } finally {
      isCreating.value = false;
    }
  };
</script>

<template>
  <PageContainer>
    <PageHeader title="Создание нового заклинания">
      <template #actions>
        <ATooltip title="Закрыть">
          <AButton
            type="text"
            @click.left.exact.prevent="navigateTo('/workshop/spells')"
          >
            <template #icon>
              <SvgIcon icon="close" />
            </template>
          </AButton>
        </ATooltip>
      </template>
    </PageHeader>

    <AForm
      ref="formRef"
      layout="vertical"
      :model="form"
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
        <ACol :span="4">
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

        <ACol :span="4">
          <AFormItem
            label="Школа"
            :name="['school']"
            :rules="[ValidationDictionaries.ruleMagicSchool()]"
          >
            <SelectMagicSchool v-model="form.school" />
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Ритуал"
            :name="['ritual']"
          >
            <ACheckbox v-model:checked="form.ritual"> Возможен </ACheckbox>
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Концентрация"
            :name="['concentration']"
          >
            <ACheckbox v-model:checked="form.concentration">
              Требуется
            </ACheckbox>
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Вербальный компонент"
            :name="['components', 'v']"
          >
            <ACheckbox v-model:checked="form.components.v">
              Требуется
            </ACheckbox>
          </AFormItem>
        </ACol>

        <ACol :span="4">
          <AFormItem
            label="Соматический компонент"
            :name="['components', 's']"
          >
            <ACheckbox v-model:checked="form.components.s">
              Требуется
            </ACheckbox>
          </AFormItem>
        </ACol>
      </ARow>

      <MaterialComponents v-model="form.components.m" />

      <CastingTimes v-model="form.castingTime" />

      <SpellDistance v-model="form.range" />

      <SpellDuration v-model="form.duration" />

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
              placeholder="Введи описание"
              :rows="8"
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
              placeholder="Введи описание"
              :rows="8"
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
            <SelectSpecie
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
            <SelectSpecie
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
            <SelectSpecie
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
            <SelectSpecie
              v-model="form.affiliations.lineages"
              multiple
            />
          </AFormItem>
        </ACol>
      </ARow>
    </AForm>

    <EditorActions
      :is-submitting="isCreating"
      :submit
    />
  </PageContainer>
</template>
