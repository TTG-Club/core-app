<script setup lang="ts">
  import { SpeciesLinkPreview, SpeciesFeatures, SpeciesSizes } from './ui';

  import { SpeciesSpeed } from '~species/editor/ui';
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectCreatureType, SelectSpecies } from '~ui/select';
  import { UploadImage, UploadGallery } from '~ui/upload';

  import type { SpeciesCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<SpeciesCreate>({ required: true });

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state="form"
    :disabled="isCreating"
    class="grid grid-cols-24 gap-4"
  >
    <EditorBaseInfo
      v-model="form"
      section="species"
    />

    <UFormField
      class="col-span-full"
      label="Описание"
      name="description"
    >
      <UTextarea
        v-model:value="form.description"
        placeholder="Введи описание"
        :rows="8"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Характеристики</span>
    </USeparator>

    <UFormField
      class="col-span-12"
      label="Основной вид"
      help="Необходимо указать, если создаешь происхождение вида"
      name="parent"
    >
      <SelectSpecies v-model="form.parent" />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Тип"
      name="properties.type"
    >
      <SelectCreatureType v-model="form.properties.type" />
    </UFormField>

    <SpeciesSizes v-model="form.properties.sizes" />

    <SpeciesSpeed v-model="form.properties.speed" />

    <SpeciesFeatures v-model="form.features" />

    <USeparator>
      <span class="font-bold text-secondary">Изображения</span>
    </USeparator>

    <UFormField
      class="col-span-8"
      label="Основное"
      help="Эта картинка отображается при просмотре страницы вида"
      name="image"
    >
      <UploadImage
        v-model="form.image"
        section="species"
        max-size="640"
      >
        <template #preview>
          <NuxtImg
            v-slot="{ src, isLoaded, imgAttrs }"
            :key="form.image"
            :src="form.image"
            custom
          >
            <!-- Show the actual image when loaded -->
            <img
              v-if="isLoaded"
              v-bind="imgAttrs"
              class="w-full rounded-lg object-contain"
              :src="src"
              :alt="form.name.rus"
            />

            <!-- Show a placeholder while loading -->
            <img
              v-else
              class="w-full rounded-lg object-contain"
              src="/img/no-img.webp"
              alt="no image"
            />
          </NuxtImg>
        </template>
      </UploadImage>
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Для ссылки"
      help="Эта картинка отображается на странице со списком видов"
      name="linkImage"
    >
      <UploadImage
        v-model="form.linkImage"
        section="species"
        max-size="256"
      >
        <template #preview>
          <SpeciesLinkPreview
            :name="form.name"
            :url="form.url"
            :image="form.linkImage"
          />
        </template>
      </UploadImage>
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Галерея"
      name="gallery"
    >
      <UploadGallery
        v-model="form.gallery"
        section="species"
      />
    </UFormField>
  </UForm>
</template>
