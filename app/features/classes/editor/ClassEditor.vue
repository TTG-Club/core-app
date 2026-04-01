<script setup lang="ts">
  import type { ClassCreate, ClassLinkResponse } from '~classes/model';

  import { ClassPreview } from '~classes/preview';
  import { MarkupEditor } from '~markup/editor';
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { UploadGallery, UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';

  import {
    CharacteristicsSettings,
    FeaturesEditor,
    ProficiencySettings,
    TableEditor,
  } from './ui';

  function getInitialState(): ClassCreate {
    return {
      url: '',
      name: {
        rus: '',
        eng: '',
        alt: [],
      },
      source: {
        url: undefined,
        page: undefined,
      },
      image: undefined,
      gallery: [],
      description: undefined,
      parentUrl: undefined,
      hitDice: undefined,
      primaryCharacteristics: {
        values: undefined,
        delimiter: undefined,
      },
      savingThrows: [],
      proficiency: {
        armor: {
          category: [],
          custom: undefined,
        },
        weapon: {
          category: [],
          custom: undefined,
        },
        tool: undefined,
        skill: {
          count: 0,
          skills: [],
        },
      },
      equipment: { type: 'doc', content: [{ type: 'paragraph' }] },
      features: [],
      table: [],
      abilityTemplate: undefined,
      casterType: undefined,
      tags: [],
    };
  }

  const { state, onError, onSubmit } = useWorkshopForm<ClassCreate>({
    actionUrl: '/api/v2/classes',
    getInitialState,
  });

  const { data: classLinks } =
    useNuxtData<ClassLinkResponse[]>('classes-select');

  const parentClass = computed<ClassLinkResponse | undefined>(() => {
    if (!state.value.parentUrl) {
      return undefined;
    }

    return classLinks.value?.find(
      (classLink) => classLink.url === state.value.parentUrl,
    );
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
      section="classes"
      :prefix="parentClass?.name.eng"
    />

    <CharacteristicsSettings
      v-model:parent-url="state.parentUrl"
      v-model:hit-dice="state.hitDice"
      v-model:caster-type="state.casterType"
      v-model:primary-characteristics="state.primaryCharacteristics"
      v-model:saving-throws="state.savingThrows"
      v-model:ability-template="state.abilityTemplate"
    />

    <ProficiencySettings v-model="state.proficiency" />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          Стартовое снаряжение
        </h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-full"
          name="equipment"
        >
          <MarkupEditor v-model="state.equipment" />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-full"
          name="description"
        >
          <MarkupEditor v-model="state.description" />
        </UFormField>
      </div>
    </UCard>

    <FeaturesEditor
      v-model="state.features"
      :is-subclass="!!state.parentUrl"
    />

    <TableEditor v-model="state.table" />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Изображения</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-12"
          label="Основное"
          name="image"
        >
          <UploadImage
            v-model="state.image"
            section="classes"
            max-size="1024"
          >
            <template #preview>
              <div class="relative w-48 overflow-hidden rounded-lg">
                <img
                  :src="state.image || '/img/no-img.webp'"
                  alt="Uploaded image"
                  class="h-full w-full object-contain"
                />
              </div>
            </template>
          </UploadImage>
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Галерея"
          name="gallery"
        >
          <UploadGallery
            v-model="state.gallery"
            section="classes"
          />
        </UFormField>
      </div>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <ClassPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
