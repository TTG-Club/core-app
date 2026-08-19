<script setup lang="ts">
  import type { SpeciesCreate } from '~species/model';

  import {
    SPECIES_MECHANICS_EDITOR,
    SPECIES_PROPERTIES_EDITOR,
    transformSpeciesBeforeSubmit,
  } from '~species/model';
  import { SpeciesPreview } from '~species/preview';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectCreatureType, SelectSpecies } from '~ui/select';
  import { UploadGallery, UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    SpeciesFeatures,
    SpeciesInnateSpells,
    SpeciesMechanicsFields,
    SpeciesSizes,
    SpeciesSpeed,
  } from './ui';

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
      srdVersion: undefined,
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
        darkVision: undefined,
      },
      features: [],
      innateSpells: [],
      mechanics: undefined,
      tags: [],
    };
  }

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<SpeciesCreate>({
      actionUrl: '/api/v2/species',
      getInitialState,
      transformBeforeSubmit: transformSpeciesBeforeSubmit,
      revisionEntityType: REVISION_ENTITY_TYPES.SPECIES,
    });
</script>

<template>
  <UForm
    :state
    class="grid gap-8 pb-24"
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

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="col-span-full"
          label="Описание"
          name="description"
        >
          <MarkupEditor
            v-model="state.description"
            placeholder="Введи описание"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Характеристики</h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="col-span-full md:col-span-12"
          label="Основной вид"
          help="Необходимо указать, если создаешь происхождение вида"
          name="parent"
        >
          <SelectSpecies v-model="state.parent" />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-12"
          label="Тип"
          name="properties.type"
        >
          <SelectCreatureType v-model="state.properties.type" />
        </UFormField>

        <UFormField
          class="col-span-full md:col-span-12"
          :label="SPECIES_PROPERTIES_EDITOR.darkVisionLabel"
          :help="SPECIES_PROPERTIES_EDITOR.darkVisionHelp"
          name="properties.darkVision"
        >
          <UInputNumber
            v-model="state.properties.darkVision"
            :placeholder="SPECIES_PROPERTIES_EDITOR.darkVisionPlaceholder"
            :min="SPECIES_PROPERTIES_EDITOR.distanceMinimum"
          />
        </UFormField>

        <SpeciesSizes v-model="state.properties.sizes" />

        <SpeciesSpeed v-model="state.properties.speed" />

        <USeparator class="col-span-full">
          <span class="font-bold text-secondary">
            {{ SPECIES_MECHANICS_EDITOR.title }}
          </span>
        </USeparator>

        <SpeciesMechanicsFields v-model="state.mechanics" />

        <SpeciesFeatures v-model="state.features" />

        <SpeciesInnateSpells v-model="state.innateSpells" />
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Изображения</h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="col-span-full md:col-span-8"
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
          class="col-span-full md:col-span-8"
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
                :key="state.linkImage"
                :src="state.linkImage"
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
          class="col-span-full md:col-span-8"
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

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <SpeciesPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
