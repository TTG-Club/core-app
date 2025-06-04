<script setup lang="ts">
  import { SpeciesLinkPreview, SpeciesFeatures, SpeciesSizes } from './ui';

  import { ValidationBase, ValidationDictionaries } from '~/shared/utils';
  import { SpeciesSpeed } from '~species/editor/ui';
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectCreatureType, SelectSpecies } from '~ui/select';
  import { UploadImage, UploadGallery } from '~ui/upload';

  import type { FormInstance } from 'ant-design-vue';
  import type { SpeciesCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<SpeciesCreate>({ required: true });

  const formRef = useTemplateRef<FormInstance>('formRef');

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
    <EditorBaseInfo
      v-model="form"
      section="species"
    />

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
          :rules="[ValidationDictionaries.ruleCreatureTypes()]"
        >
          <SelectCreatureType v-model="form.properties.type" />
        </AFormItem>
      </ACol>
    </ARow>

    <SpeciesSizes v-model="form.properties.sizes" />

    <SpeciesSpeed v-model="form.properties.speed" />

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
          <UploadImage
            v-model="form.image"
            section="species"
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
          <UploadImage
            v-model="form.linkImage"
            section="species"
            max-size="190"
          >
            <template #preview>
              <SpeciesLinkPreview
                :name="form.name"
                :url="form.url"
                :image="form.linkImage"
              />
            </template>
          </UploadImage>
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Галерея"
          :name="['gallery']"
        >
          <UploadGallery
            v-model="form.gallery"
            section="species"
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
