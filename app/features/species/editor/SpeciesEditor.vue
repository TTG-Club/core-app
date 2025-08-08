<script setup lang="ts">
  import { SpeciesLinkPreview, SpeciesFeatures, SpeciesSizes } from './ui';

  import { SpeciesSpeed } from '~species/editor/ui';
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SelectCreatureType, SelectSpecies } from '~ui/select';
  import { UploadImage, UploadGallery } from '~ui/upload';

  import type { SpeciesCreate } from '~/shared/types';

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });

  function getInitialState(): SpeciesCreate {
    return {
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
    };
  }

  const { state, onError, onSubmit } = await useWorkshopForm<SpeciesCreate>(
    computed(() => ({
      actionUrl: '/api/v2/species',
      getInitialState,
    })),
  );
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid grid-cols-24 gap-4"
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      v-model="state"
      section="species"
    />

    <UFormField
      class="col-span-full"
      label="Описание"
      name="description"
    >
      <UTextarea
        v-model="state.description"
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
      <SelectSpecies v-model="state.parent" />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Тип"
      name="properties.type"
    >
      <SelectCreatureType v-model="state.properties.type" />
    </UFormField>

    <SpeciesSizes v-model="state.properties.sizes" />

    <SpeciesSpeed v-model="state.properties.speed" />

    <SpeciesFeatures v-model="state.features" />

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
        v-model="state.image"
        section="species"
        max-size="640"
      >
        <template #preview>
          <NuxtImg
            v-slot="{ src, isLoaded, imgAttrs }"
            :key="state.image"
            :src="state.image"
            custom
          >
            <!-- Show the actual image when loaded -->
            <img
              v-if="isLoaded"
              v-bind="imgAttrs"
              class="w-full rounded-lg object-contain"
              :src="src"
              :alt="state.name.rus"
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
        v-model="state.linkImage"
        section="species"
        max-size="256"
      >
        <template #preview>
          <SpeciesLinkPreview
            :name="state.name"
            :url="state.url"
            :image="state.linkImage"
            :source="state.source"
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
        v-model="state.gallery"
        section="species"
      />
    </UFormField>

    <EditorFormControls />
  </UForm>
</template>
