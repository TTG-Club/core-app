<script setup lang="ts">
  import { Dictionaries } from '~/shared';
  import { slugify } from 'transliteration';
  import {
    chain,
    difference,
    isArray,
    isEqual,
    isString,
    trim,
  } from 'lodash-es';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type {
    SpecieCreate,
    SpecieLink,
  } from '#shared/types/character/species';
  import { Button, type FormInstance } from 'ant-design-vue';
  import { SvgIcon } from '#components';
  import { ValidationBase, ValidationSpecie } from '~/utils/validation/';

  withDefaults(
    defineProps<{
      isEditing?: boolean;
    }>(),
    {
      isEditing: false,
    },
  );

  const formRef = useTemplateRef<FormInstance>('formRef');

  const {
    data: species,
    status: speciesStatus,
    refresh: refreshSpecies,
  } = await useAsyncData('species', async () => {
    const specieLinks = await $fetch<Array<SpecieLink>>(
      '/api/v2/species/search',
      {
        method: 'post',
      },
    );

    return specieLinks.map((specie) => ({
      label: `${specie.name.rus} [${specie.name.eng}]`,
      value: specie.url,
    }));
  });

  const {
    data: sizes,
    status: sizesStatus,
    refresh: refreshSizes,
  } = await useAsyncData('dictionaries-sizes', () => Dictionaries.sizes());

  const {
    data: creatureTypes,
    status: creatureTypesStatus,
    refresh: refreshCreatureTypes,
  } = await useAsyncData('dictionaries-creature-types', () =>
    Dictionaries.creatureTypes(),
  );

  const getEmptyFeature = (): SpecieCreate['features'][number] => ({
    name: {
      rus: '',
      eng: '',
    },
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
    image: undefined,
    linkImage: undefined,
    gallery: [],
    parent: undefined,
    source: {
      url: undefined,
      page: undefined,
    },
    properties: {
      size: undefined,
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

  const altNames = ref<Array<string>>([]);

  const computedAltNames = computed<Array<SelectOption>>(() =>
    altNames.value.map((name) => ({
      label: name,
      value: name,
    })),
  );

  const handleAltNamesChange = (value: SelectValue) => {
    if (isString(value)) {
      const trimmed = value.trim();

      altNames.value = [trimmed];
      form.value.name.alt = [trimmed];

      return;
    }

    if (!isArray(value)) {
      form.value.name.alt = [];

      return;
    }

    const collection = chain(value).filter(isString).map(trim).union().value();

    form.value.name.alt = collection;

    altNames.value.push(...difference(collection, altNames.value));
  };

  const tags = ref<Array<string>>([]);

  const computedTags = computed<Array<SelectOption>>(() =>
    tags.value.map((tag) => ({
      label: tag,
      value: tag,
    })),
  );

  const handleTagsChange = (value: SelectValue) => {
    if (isString(value)) {
      const trimmed = value.trim();

      tags.value = [trimmed];
      form.value.tags = [trimmed];

      return;
    }

    if (!isArray(value)) {
      form.value.tags = [];

      return;
    }

    const collection = chain(value).filter(isString).map(trim).union().value();

    form.value.tags = collection;

    tags.value.push(...difference(collection, tags.value));
  };

  const getFeatButtons = (index: number): Array<() => VNode> => {
    const empty = getEmptyFeature();
    const feats = form.value.features;
    const el = feats[index];

    if (!el) {
      return [];
    }

    if (index === feats.length - 1) {
      if (isEqual(empty, el)) {
        return [
          () =>
            h(
              Button,
              {
                disabled: true,
                icon: h(SvgIcon, { icon: 'plus' }),
              },
              () => 'Добавить черту',
            ),
        ];
      }

      return [
        () =>
          h(
            Button,
            {
              danger: true,
              icon: h(SvgIcon, { icon: 'clear' }),
              onClick: withModifiers(
                () => (feats[index] = getEmptyFeature()),
                ['left', 'exact', 'prevent'],
              ),
            },
            () => 'Очистить',
          ),
        () =>
          h(
            Button,
            {
              icon: h(SvgIcon, { icon: 'plus' }),
              onClick: withModifiers(
                () => feats.push(getEmptyFeature()),
                ['left', 'exact', 'prevent'],
              ),
            },
            () => 'Добавить черту',
          ),
      ];
    }

    return [
      () =>
        h(
          Button,
          {
            danger: true,
            icon: h(SvgIcon, { icon: 'remove' }),
            onClick: withModifiers(
              () => feats.splice(index, 1),
              ['left', 'exact', 'prevent'],
            ),
          },
          () => 'Удалить черту',
        ),
    ];
  };

  const handleDropdownOpening = (
    state: boolean,
    callback: () => Promise<void>,
  ) => {
    if (!state) {
      return;
    }

    callback();
  };

  const getSlugifyUrl = (value: string) =>
    slugify(value, {
      lowercase: true,
      trim: true,
      allowedChars: 'a-zA-Z0-9-_',
    });

  const handleEngNameChange = (name: string) => {
    form.value.name.eng = name;
    form.value.url = getSlugifyUrl(name);

    formRef.value?.validateFields(['url']);
  };

  const handleUrlChange = (url: string) => {
    form.value.url = getSlugifyUrl(url);
  };

  const submit = () => {
    formRef.value?.validate();
  };
</script>

<template>
  <PageContainer>
    <PageHeader title="Создание нового вида">
      <template #actions>
        <AButton
          type="primary"
          @click.left.exact.prevent="submit"
        >
          <template #icon>
            <SvgIcon icon="check" />
          </template>

          <template #default> Создать </template>
        </AButton>

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
              :value="form.name.eng"
              placeholder="Введи английское название"
              @update:value="handleEngNameChange"
            />
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Название (альт.)"
            tooltip="Альтернативные названия. Используется для поиска и СЕО."
            :name="['name', 'alt']"
          >
            <ASelect
              :value="form.name.alt"
              :options="computedAltNames"
              placeholder="Введи альтернативные названия"
              mode="tags"
              @change="handleAltNamesChange"
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
            <ASelect
              v-model:value="form.source.url"
              placeholder="Выбери книгу"
              allow-clear
              show-search
              @change="
                form.source.page = !$event ? undefined : form.source.page
              "
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
            <ASelect
              :value="form.tags"
              :options="computedTags"
              placeholder="Введи теги"
              mode="tags"
              @change="handleTagsChange"
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
            <AInput
              :value="form.url"
              addon-before="https://ttg.club/species/"
              placeholder="Сгенерированный URL"
              @update:value="handleUrlChange"
            />
          </AFormItem>
        </ACol>
      </ARow>

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
          >
            <AUploadDragger
              name="specie-image"
              :show-upload-list="false"
            >
              <AFlex
                :class="$style.upload"
                :gap="8"
                justify="center"
                align="center"
                vertical
              >
                <SvgIcon
                  size="24"
                  icon="download"
                />

                <span type="secondary">
                  Перетащите или нажмите сюда, чтобы загрузить картинку в
                  форматах: .webp, .jpg, .jpeg, .png
                </span>
              </AFlex>
            </AUploadDragger>
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Для ссылки"
            tooltip="Эта картинка отображается на странице списка видов"
          >
            <AUploadDragger
              name="specie-image"
              :show-upload-list="false"
            >
              <AFlex
                :class="$style.upload"
                :gap="8"
                justify="center"
                align="center"
                vertical
              >
                <SvgIcon
                  size="24"
                  icon="download"
                />

                <span type="secondary">
                  Перетащите или нажмите сюда, чтобы загрузить картинку в
                  форматах: .webp, .jpg, .jpeg, .png
                </span>
              </AFlex>
            </AUploadDragger>
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem label="Галерея">
            <AFlex :gap="16">
              <ASkeletonImage />

              <ASkeletonImage />

              <ASkeletonImage />

              <ASkeletonImage />
            </AFlex>
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
            tooltip="Необходимо указать, если создаешь новый подвид"
            :name="['parent']"
          >
            <ASelect
              v-model:value="form.parent"
              :loading="speciesStatus === 'pending'"
              :options="species"
              placeholder="Выбери основной вид"
              show-search
              @dropdown-visible-change="
                handleDropdownOpening($event, refreshSpecies)
              "
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Размер"
            :name="['properties', 'size']"
            :rules="[ValidationSpecie.ruleSize()]"
          >
            <ASelect
              v-model:value="form.properties.size"
              :loading="sizesStatus === 'pending'"
              :options="sizes"
              placeholder="Выбери размер существа"
              show-search
              @dropdown-visible-change="
                handleDropdownOpening($event, refreshSizes)
              "
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="Тип"
            :name="['properties', 'type']"
            :rules="[ValidationSpecie.ruleCreatureType()]"
          >
            <ASelect
              v-model:value="form.properties.type"
              :loading="creatureTypesStatus === 'pending'"
              :options="creatureTypes"
              placeholder="Выбери тип существа"
              show-search
              @dropdown-visible-change="
                handleDropdownOpening($event, refreshCreatureTypes)
              "
            />
          </AFormItem>
        </ACol>

        <ACol :span="6">
          <AFormItem
            label="ТЗ"
            tooltip="Темное зрение"
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
          content="Черты"
          strong
        />
      </ADivider>

      <template
        v-for="(feature, featIndex) in form.features"
        :key="featIndex"
      >
        <ARow :gutter="16">
          <ACol :span="12">
            <AFormItem
              label="Название"
              :name="['features', featIndex, 'name', 'rus']"
              :rules="[ValidationBase.ruleRusName()]"
            >
              <AInput
                v-model:value="feature.name.rus"
                placeholder="Введи название"
              />
            </AFormItem>
          </ACol>

          <ACol :span="12">
            <AFormItem
              label="Название (англ.)"
              tooltip="Английское название"
              :name="['features', featIndex, 'name', 'eng']"
              :rules="[ValidationBase.ruleRusName()]"
            >
              <AInput
                v-model:value="feature.name.eng"
                placeholder="Введи английское название"
              />
            </AFormItem>
          </ACol>
        </ARow>

        <ARow :gutter="16">
          <ACol :span="16">
            <AFormItem
              label="Источник"
              tooltip="Книга, из которой взята информация о черте, если она существует"
              :name="['features', featIndex, 'source', 'url']"
            >
              <ASelect
                v-model:value="feature.source.url"
                placeholder="Выбери источник"
                @change="
                  feature.source.page = !$event
                    ? undefined
                    : feature.source.page
                "
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
              :rules="[
                {
                  required: true,
                  type: 'string',
                  trigger: ['blur', 'change'],
                  message: 'Поле обязательно для заполнения',
                },
              ]"
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
          <component
            :is="btn"
            v-for="(btn, btnIndex) in getFeatButtons(featIndex)"
            :key="btnIndex"
          />
        </AFlex>

        <ADivider v-if="featIndex !== form.features.length - 1" />
      </template>
    </AForm>
  </PageContainer>
</template>

<style module lang="scss">
  .upload {
    color: currentColor;
  }
</style>
