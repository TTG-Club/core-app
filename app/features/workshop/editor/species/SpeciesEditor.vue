<script setup lang="ts">
  import { PageHeader, PageContainer } from '~/features/page';
  import { isEqual } from 'lodash-es';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { SpecieCreate, SpecieLink } from '~/shared/types';
  import type { FormInstance } from 'ant-design-vue';
  import {
    SvgIcon,
    SelectCreatureType,
    SelectSize,
    SelectSource,
    SelectSpecie,
    SelectTags,
  } from '~/shared/ui';
  import {
    ValidationBase,
    ValidationSpecie,
    ValidationDictionaries,
  } from '~/shared/utils';
  import { SpeciesLink } from '~/features/wiki';
  import { SpecieGallery, SpecieImage } from './ui';
  import { InputUrl, EditorActions } from '../ui';

  withDefaults(
    defineProps<{
      isEditing?: boolean;
    }>(),
    {
      isEditing: false,
    },
  );

  const formRef = useTemplateRef<FormInstance>('formRef');

  const getEmptyFeature = (): SpecieCreate['features'][number] => ({
    name: '',
    description: '',
    source: {
      url: undefined,
      page: undefined,
    },
  });

  const form = ref<SpecieCreate>({
    url: '',
    name: {
      rus: '',
      eng: '',
      alt: [],
    },
    description: '',
    image: undefined, // TODO: удалить предыдущий файл перед заменой
    linkImage: undefined, // TODO: удалить предыдущий файл перед заменой
    gallery: [], // TODO: удалить предыдущий файл перед заменой
    parent: undefined,
    source: {
      url: undefined,
      page: undefined,
    },
    properties: {
      sizes: undefined,
      type: undefined,
      darkVision: 0,
      speed: {
        base: 30,
        fly: 0,
        climb: 0,
        swim: 0,
      },
    },
    features: [getEmptyFeature()],
    tags: [],
  });

  const specieLinkPreview = computed<SpecieLink>(() => ({
    name: {
      rus: form.value.name.rus,
      eng: form.value.name.eng,
    },
    url: form.value.url,
    image: form.value.linkImage,
  }));

  const isFeatureEmpty = (feat: SpecieCreate['features'][number]) =>
    isEqual(feat, getEmptyFeature());

  const isLastFeature = (index: number) =>
    index === form.value.features.length - 1;

  const addFeature = (indexOfNewFeature: number) => {
    form.value.features.splice(indexOfNewFeature, 0, getEmptyFeature());
  };

  const clearFeature = (index: number) => {
    form.value.features.splice(index, 1, getEmptyFeature());
  };

  const removeFeature = (index: number) => {
    form.value.features.splice(index, 1);
  };

  const resetBookPage = (index?: number) => {
    if (typeof index !== 'number') {
      form.value.source.page = undefined;

      return;
    }

    if (!form.value.features[index]) {
      return;
    }

    form.value.features[index].source.page = undefined;
  };

  const handleBookChange = (value: SelectValue, index?: number) => {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      resetBookPage(index);
    }

    if (typeof index !== 'number') {
      form.value.source.url = value;

      return;
    }

    if (!form.value.features[index]) {
      return;
    }

    form.value.features[index].source.url = value;
  };

  const isCreating = ref(false);

  const submit = async () => {
    isCreating.value = true;

    try {
      const payload = await formRef.value?.validate();

      await $fetch('/api/v2/species/new', {
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
    } finally {
      isCreating.value = false;
    }
  };
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
            :rules="[ValidationSpecie.ruleUrl()]"
          >
            <InputUrl
              v-model="form.url"
              :eng-name="form.name.eng"
              :source-url="form.source.url"
              addon-before="https://ttg.club/species/"
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
        <ACol :span="6">
          <AFormItem
            label="Основной вид"
            tooltip="Необходимо указать, если создаешь происхождение вида"
            :name="['parent']"
          >
            <SelectSpecie v-model="form.parent" />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Тип"
            :name="['properties', 'type']"
            :rules="[ValidationDictionaries.ruleCreatureType()]"
          >
            <SelectCreatureType v-model="form.properties.type" />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Размер"
            :name="['properties', 'sizes']"
            :rules="[ValidationDictionaries.ruleSize()]"
          >
            <SelectSize v-model="form.properties.sizes" />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Темное зрение"
            :name="['properties', 'darkVision']"
          >
            <AInputNumber
              v-model:value="form.properties.darkVision"
              :precision="0"
              placeholder="Введи дистанцию ночного зрения"
              default-value="0"
              min="0"
            />
          </AFormItem>
        </ACol>
      </ARow>

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
          <AFormItem
            label="Скорость полета"
            :name="['properties', 'speed', 'fly']"
          >
            <AInputNumber
              v-model:value="form.properties.speed.fly"
              :precision="0"
              placeholder="Введи скорость полета"
              default-value="0"
              min="0"
            />
          </AFormItem>
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
              default-value="0"
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
              default-value="0"
              min="0"
            />
          </AFormItem>
        </ACol>
      </ARow>

      <ADivider orientation="left">
        <ATypographyText
          type="secondary"
          content="Особенности"
          strong
        />
      </ADivider>

      <template
        v-for="(feature, featIndex) in form.features"
        :key="featIndex"
      >
        <ARow :gutter="16">
          <ACol :span="8">
            <AFormItem
              label="Название"
              :name="['features', featIndex, 'name']"
              :rules="[ValidationBase.ruleRusName()]"
            >
              <AInput
                v-model:value="feature.name"
                placeholder="Введи название"
              />
            </AFormItem>
          </ACol>

          <ACol :span="8">
            <AFormItem
              label="Источник"
              tooltip="Книга, из которой взята информация о черте, если она существует"
              :name="['features', featIndex, 'source', 'url']"
            >
              <SelectSource
                :model-value="feature.source.url"
                @update:model-value="handleBookChange($event, featIndex)"
              />
            </AFormItem>
          </ACol>

          <ACol :span="8">
            <AFormItem
              label="Страница в источнике"
              tooltip="Номер страницы книги, откуда была взята информация о черте, если выбрана сама книга"
              :name="['features', featIndex, 'source', 'page']"
              :rules="[ValidationBase.ruleSourcePage(!!feature.source.url)]"
            >
              <AInputNumber
                v-model:value="feature.source.page"
                :disabled="!feature.source.url"
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
              :name="['features', featIndex, 'description']"
              :rules="[ValidationBase.ruleString()]"
            >
              <ATextarea
                v-model:value="feature.description"
                :auto-size="{ minRows: 3, maxRows: 8 }"
                placeholder="Введи описание"
              />
            </AFormItem>
          </ACol>
        </ARow>

        <AFlex
          justify="flex-end"
          :gap="16"
        >
          <AFlex :gap="8">
            <AButton @click.left.exact.prevent="addFeature(featIndex + 1)">
              Добавить особенность
            </AButton>

            <AButton
              v-if="isLastFeature(featIndex)"
              :disabled="isFeatureEmpty(feature)"
              danger
              @click.left.exact.prevent="clearFeature(featIndex)"
            >
              Очистить особенность
            </AButton>

            <AButton
              v-else
              danger
              @click.left.exact.prevent="removeFeature(featIndex)"
            >
              Удалить особенность
            </AButton>
          </AFlex>
        </AFlex>

        <ADivider v-if="!isLastFeature(featIndex)" />
      </template>

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
            <SpecieImage
              v-model="form.image"
              path="/species"
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
            <SpecieImage
              v-model="form.linkImage"
              path="/species"
              max-size="190"
            >
              <template #preview>
                <SpeciesLink
                  :specie="specieLinkPreview"
                  disabled
                />
              </template>
            </SpecieImage>
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Галерея"
            :name="['gallery']"
          >
            <SpecieGallery
              v-model="form.gallery"
              path="/species"
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
