<script setup lang="ts">
  import { Dictionaries } from '~/shared';
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
  import { getSlug } from '#shared/utils/getSlug';
  import type { BookDetail } from '#shared/types/wiki/books';

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
  } = await useAsyncData('species-select', async () => {
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
    data: books,
    status: booksStatus,
    refresh: refreshBooks,
  } = await useAsyncData('books-select', async () => {
    const specieLinks = await $fetch<Array<BookDetail>>(
      '/api/v2/books/search',
      {
        method: 'post',
      },
    );

    return specieLinks.map((specie) => ({
      label: `${specie.name.rus} [${specie.name.eng}]`,
      value: specie.name.short,
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

  const specieLinkPreview = computed<SpecieLink>(() => ({
    name: {
      rus: form.value.name.rus,
      eng: form.value.name.eng,
    },
    url: form.value.url,
    image: form.value.linkImage,
  }));

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
    getSlug(value, {
      trim: true,
      lowercase: true,
      allowedChars: 'a-zA-Z0-9-',
    });

  const getUrl = (engName: string, source?: string) => {
    const sourcePostfix = source ? `-${source}` : '';

    return getSlugifyUrl(`${engName}${sourcePostfix}`);
  };

  const handleUrlChange = (url: string) => {
    form.value.url = getSlugifyUrl(url);

    formRef.value?.validateFields(['url']);
  };

  const handleEngNameChange = (name: string) => {
    form.value.name.eng = name;

    handleUrlChange(getUrl(name, form.value.source.url));
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

      handleUrlChange(getUrl(form.value.url, value));

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
              :value="form.source.url"
              :loading="booksStatus === 'pending'"
              :options="books || []"
              placeholder="Выбери книгу"
              allow-clear
              show-search
              @update:value="handleBookChange"
              @dropdown-visible-change="
                handleDropdownOpening($event, refreshBooks)
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
              :options="species || []"
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
            label="Тип"
            :name="['properties', 'type']"
            :rules="[ValidationSpecie.ruleCreatureType()]"
          >
            <ASelect
              v-model:value="form.properties.type"
              :loading="creatureTypesStatus === 'pending'"
              :options="creatureTypes || []"
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
            label="Размер"
            :name="['properties', 'sizes']"
            :rules="[ValidationSpecie.ruleSize()]"
          >
            <ASelect
              v-model:value="form.properties.sizes"
              :loading="sizesStatus === 'pending'"
              :options="sizes || []"
              placeholder="Выбери размер существа"
              max-tag-count="responsive"
              mode="multiple"
              show-search
              @dropdown-visible-change="
                handleDropdownOpening($event, refreshSizes)
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
              :rules="[ValidationBase.ruleEngName()]"
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
                :value="feature.source.url"
                :loading="booksStatus === 'pending'"
                :options="books || []"
                placeholder="Выбери источник"
                allow-clear
                show-search
                @update:value="handleBookChange($event, featIndex)"
                @dropdown-visible-change="
                  handleDropdownOpening($event, refreshBooks)
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
            <WorkshopEditorUiUploadImage
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
            <WorkshopEditorUiUploadImage
              v-model="form.linkImage"
              path="/species"
              max-size="190"
            >
              <template #preview>
                <CharacterSpeciesLink
                  :specie="specieLinkPreview"
                  disabled
                />
              </template>
            </WorkshopEditorUiUploadImage>
          </AFormItem>
        </ACol>

        <ACol :span="8">
          <AFormItem
            label="Галерея"
            :name="['gallery']"
          >
            <WorkshopEditorUiUploadGallery
              v-model="form.gallery"
              path="/species"
            />
          </AFormItem>
        </ACol>
      </ARow>
    </AForm>

    <AFlex
      :class="$style.actions"
      :gap="16"
      justify="flex-end"
    >
      <AButton
        type="primary"
        :loading="isCreating"
        @click.left.exact.prevent="submit"
      >
        <template #icon>
          <SvgIcon icon="check" />
        </template>

        <template #default> Создать </template>
      </AButton>
    </AFlex>
  </PageContainer>
</template>

<style module lang="scss">
  .actions {
    position: sticky;
    bottom: 0;
    padding: 16px;
  }
</style>
