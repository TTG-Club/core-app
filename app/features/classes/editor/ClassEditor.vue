<script setup lang="ts">
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { UploadGallery, UploadImage } from '~ui/upload';
  import {
    SelectAbilities,
    SelectCasterType,
    SelectClass,
    SelectDice,
  } from '~ui/select';

  import type { ClassCreate, ClassLinkResponse } from '~classes/types';
  import {
    ClassEditorProficiency,
    ClassEditorTable,
    ClassEditorFeatures,
  } from './ui';
  import { ClassPreview } from '~classes/preview';

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
      primaryCharacteristics: undefined,
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
      equipment: undefined,
      features: [],
      table: [],
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

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          Характеристики и родительский класс
        </h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-12"
          label="Родительский класс"
          name="parentUrl"
        >
          <SelectClass v-model="state.parentUrl" />
        </UFormField>

        <UFormField
          class="col-span-6"
          label="Кость хитов"
          name="hitDice"
        >
          <SelectDice
            v-model="state.hitDice"
            placeholder="Выбери кость хитов"
          />
        </UFormField>

        <UFormField
          class="col-span-6"
          label="Тип заклинателя"
          name="casterType"
        >
          <SelectCasterType v-model="state.casterType" />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Основная хар-ка"
          name="primaryCharacteristics"
        >
          <SelectAbilities
            v-model="state.primaryCharacteristics"
            multiple
          />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Спасброски"
          name="savingThrows"
        >
          <SelectAbilities
            v-model="state.savingThrows"
            :limit="2"
            multiple
          />
        </UFormField>
      </div>
    </UCard>

    <ClassEditorProficiency v-model="state.proficiency" />

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
          <UTextarea
            v-model="state.equipment"
            placeholder="Опиши стартовое снаряжение"
            :rows="4"
          />
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
          <UTextarea
            v-model="state.description"
            placeholder="Введи описание"
            :rows="8"
          />
        </UFormField>
      </div>
    </UCard>

    <ClassEditorFeatures
      v-model="state.features"
      :is-subclass="!!state.parentUrl"
    />

    <ClassEditorTable v-model="state.table" />

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
          />
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
