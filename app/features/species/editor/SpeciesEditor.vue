<script setup lang="ts">
  import {
    PageHeader,
    PageContainer,
    SvgIcon,
    SelectCreatureType,
    SelectSource,
    SelectSpecies,
    SelectTags,
    InputUrl,
    EditorActions,
  } from '~/shared/ui';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { SpeciesCreate } from '~/shared/types';
  import type { FormInstance } from 'ant-design-vue';
  import {
    ValidationBase,
    ValidationSpecies,
    ValidationDictionaries,
  } from '~/shared/utils';
  import {
    SpeciesGallery,
    SpeciesImage,
    SpeciesLinkPreview,
    SpeciesFeatures,
    SpeciesSizes,
  } from './ui';
  import { NuxtLink } from '#components';

  const siteConfig = useSiteConfig();
  const { notification } = App.useApp();

  const formRef = useTemplateRef<FormInstance>('formRef');

  const form = ref<SpeciesCreate>({
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    description: '',
    image: undefined,
    linkImage: undefined,
    gallery: [],
    parent: undefined,
    source: {
      url: undefined,
      page: undefined,
    },
    properties: {
      sizes: [],
      type: undefined,
      speed: {
        base: 30,
        fly: undefined,
        climb: undefined,
        swim: undefined,
        hover: false,
      },
    },
    features: [],
    tags: [],
  });

  function resetBookPage() {
    form.value.source.page = undefined;
  }

  function handleBookChange(value: SelectValue) {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      resetBookPage();
    }

    form.value.source.url = value;
  }

  const isCreating = ref(false);
  const isCreated = ref(false);

  async function submit() {
    isCreating.value = true;

    try {
      const payload = await formRef.value?.validate();

      await $fetch<string>('/api/v2/species', {
        method: 'POST',
        body: payload,
        onRequestError: () => {
          isCreating.value = false;
        },
        onResponseError: (error) => {
          isCreating.value = false;

          notification.error({
            message: 'Ошибка создания вида',
            description: error.response._data.message,
          });
        },
      });

      isCreated.value = true;

      notification.success({
        message: () =>
          !form.value.parent
            ? 'Вид успешно создан'
            : 'Происхождение успешно создано',
        description: () =>
          h('span', [
            'Можешь перейти на его ',
            h(
              NuxtLink,
              {
                to: {
                  name: 'species-url',
                  params: {
                    url: form.value.url,
                  },
                },
                target: '_blank',
              },
              () => 'страницу',
            ),
          ]),
        onClose: () => navigateTo({ name: 'workshop-species' }),
      });
    } catch (err) {
      isCreating.value = false;
    }
  }
</script>

<template>
  <PageContainer>
    <PageHeader title="Создание нового вида">
      <template #actions>
        <ATooltip title="Закрыть">
          <AButton
            type="text"
            @click.left.exact.prevent="navigateTo('/workshop/species')"
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
      :disabled="isCreated"
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

      <ARow>
        <ACol :span="24">
          <AFormItem
            label="Описание"
            :name="['description']"
          >
            <ATextarea
              v-model:value="form.description"
              placeholder="Введи описание"
              :rows="8"
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
            :rules="[ValidationSpecies.ruleUrl()]"
          >
            <InputUrl
              v-model="form.url"
              :eng-name="form.name.eng"
              :source-url="form.source.url"
              :addon-before="`${siteConfig.url}/species/`"
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Характеристики"
          strong
        />
      </ADivider>

      <ARow :gutter="16">
        <ACol :span="12">
          <AFormItem
            label="Основной вид"
            tooltip="Необходимо указать, если создаешь происхождение вида"
            :name="['parent']"
          >
            <SelectSpecies v-model="form.parent" />
          </AFormItem>
        </ACol>

        <ACol :span="12">
          <AFormItem
            label="Тип"
            :name="['properties', 'type']"
            :rules="[ValidationDictionaries.ruleCreatureType()]"
          >
            <SelectCreatureType v-model="form.properties.type" />
          </AFormItem>
        </ACol>
      </ARow>

      <SpeciesSizes v-model="form.properties.sizes" />

      <ARow :gutter="16">
        <ACol :span="6">
          <AFormItem
            label="Скорость передвижения"
            :name="['properties', 'speed', 'base']"
          >
            <AInputNumber
              v-model:value="form.properties.speed.base"
              :precision="0"
              placeholder="Введи скорость передвижения"
              default-value="30"
              min="0"
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <ARow :gutter="16">
            <ACol :span="16">
              <AFormItem
                label="Скорость полета"
                :name="['properties', 'speed', 'fly']"
              >
                <AInputNumber
                  v-model:value="form.properties.speed.fly"
                  :precision="0"
                  placeholder="Введи скорость полета"
                  min="0"
                />
              </AFormItem>
            </ACol>

            <ACol :span="8">
              <AFormItem
                label="Парит"
                :name="['properties', 'speed', 'hover']"
              >
                <ACheckbox v-model:checked="form.properties.speed.hover">
                  Да
                </ACheckbox>
              </AFormItem>
            </ACol>
          </ARow>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Скорость лазания"
            :name="['properties', 'speed', 'climb']"
          >
            <AInputNumber
              v-model:value="form.properties.speed.climb"
              :precision="0"
              placeholder="Введи скорость лазания"
              min="0"
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Скорость плавания"
            :name="['properties', 'speed', 'swim']"
          >
            <AInputNumber
              v-model:value="form.properties.speed.swim"
              :precision="0"
              placeholder="Введи скорость плавания"
              min="0"
            />
          </AFormItem>
        </ACol>
      </ARow>

      <SpeciesFeatures v-model="form.features" />

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Изображения"
          strong
        />
      </ADivider>

      <ARow :gutter="16">
        <ACol :span="8">
          <AFormItem
            label="Основное"
            tooltip="Эта картинка отображается при просмотре страницы вида"
            :name="['image']"
            :rules="[ValidationBase.ruleImage()]"
          >
            <SpeciesImage
              v-model="form.image"
              path="species"
              max-size="480"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Для ссылки"
            tooltip="Эта картинка отображается на странице со списком видов"
            :name="['linkImage']"
            :rules="[ValidationBase.ruleImage()]"
          >
            <SpeciesImage
              v-model="form.linkImage"
              path="species"
              max-size="190"
            >
              <template #preview>
                <SpeciesLinkPreview
                  :name="form.name"
                  :url="form.url"
                  :image="form.linkImage"
                />
              </template>
            </SpeciesImage>
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Галерея"
            :name="['gallery']"
          >
            <SpeciesGallery
              v-model="form.gallery"
              path="species"
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
  </PageContainer>
</template>
