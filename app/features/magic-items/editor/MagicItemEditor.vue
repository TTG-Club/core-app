<script setup lang="ts">
  import { ValidationDictionaries, ValidationBase } from '~/shared/utils';
  import {
    MagicItemAttunement,
    SelectMagicItemCategory,
  } from '~magic-items/editor/ui';
  import MagicItemRarity from '~magic-items/editor/ui/MagicItemRarity.vue';
  import { ValidationMagicItem } from '~magic-items/editor/validators';
  import { SpeciesImage } from '~species/editor/ui';
  import { InputUrl } from '~ui/input';
  import { SelectSource, SelectTags } from '~ui/select';

  import type { FormInstance } from 'ant-design-vue';
  import type { SelectValue } from 'ant-design-vue/es/select';
  import type { MagicItemCreate } from '~magic-items/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<MagicItemCreate>({ required: true });

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
        >
          <InputUrl
            v-model="form.url"
            :eng-name="form.name.eng"
            :source-url="form.source.url"
            :addon-before="`${getOrigin()}/magic-items/`"
            :rules="[ValidationMagicItem.ruleUrl(oldUrl)]"
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
      <ACol :span="4">
        <AFormItem
          label="Категория"
          :name="['category']"
          :rules="[ValidationDictionaries.ruleMagicItemCategory()]"
        >
          <SelectMagicItemCategory
            v-model:value="form.category"
            placeholder="Выбери категорию"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Уточнение категории"
          :name="['typeClarification']"
        >
          <AInput
            v-model:value="form.typeClarification"
            placeholder="Введи название"
          />
        </AFormItem>
      </ACol>

      <MagicItemRarity
        v-model:rarity="form.rarity"
        v-model:varies="form.varies"
      />
    </ARow>

    <MagicItemAttunement v-model="form.attunement" />

    <ARow :gutter="16">
      <ACol :span="4">
        <AFormItem
          label="Количество зарядов"
          tooltip="Введите количество зарядов магического предмета (если есть)"
          :name="['charges']"
        >
          <AInputNumber
            v-model:value="form.charges"
            :precision="0"
            placeholder="Введи количество зарядов"
            min="0"
          />
        </AFormItem>
      </ACol>

      <ACol :span="4">
        <AFormItem label="Проклятие">
          <ACheckbox
            v-model="form.curse"
            :checked="!!form.curse"
          >
            Есть
          </ACheckbox>
        </AFormItem></ACol
      >
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
          tooltip="Эта картинка отображается при просмотре страницы магического предмета"
          :name="['image']"
        >
          <SpeciesImage
            v-model="form.image"
            section="magic-item"
            max-size="480"
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
