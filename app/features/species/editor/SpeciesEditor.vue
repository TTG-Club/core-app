<script setup lang="ts">
  import { SpeciesPreview } from '~species/preview';
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SelectCreatureType, SelectSpecies } from '~ui/select';
  import { UploadGallery, UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';

  import { SpeciesFeatures, SpeciesSizes, SpeciesSpeed } from './ui';

  import type { SpeciesCreate } from '~species/model';

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

  const { state, onError, onSubmit } = useWorkshopForm<SpeciesCreate>({
    actionUrl: '/api/v2/species',
    getInitialState,
  });
</script>

<template>
  <UForm
    :state
    class="grid gap-8"
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      v-model="state"
      section="species"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
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
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Характеристики</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
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
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Изображения</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-8"
          label="Основное"
          help="Эта картинка отображается при просмотре страницы вида"
          name="image"
        >
          <UploadImage
            v-model="state.image"
            section="species"
            max-size="1024"
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
                  class="aspect-square w-full rounded-lg object-cover"
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
          label="Галерея"
          name="gallery"
        >
          <UploadGallery
            v-model="state.gallery"
            section="species"
          />
        </UFormField>
      </div>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <SpeciesPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
