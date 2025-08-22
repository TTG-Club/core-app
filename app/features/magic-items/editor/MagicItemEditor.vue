<script setup lang="ts">
  import {
    MagicItemRarity,
    MagicItemAttunement,
    MagicItemCategory,
  } from './ui';

  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { UploadImage } from '~ui/upload';

  import type {
    MagicItemCreate,
    MagicItemDetailResponse,
  } from '~magic-items/types';
  import { MagicItemPreview } from '~magic-items/preview';

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });

  function getInitialState(): MagicItemCreate {
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
      description: '',
      category: {
        type: undefined,
        clarification: undefined,
      },
      rarity: {
        type: undefined,
        varies: undefined,
      },
      attunement: {
        requires: false,
        description: null,
      },
      charges: 0,
      curse: false,
      consumable: false,
      image: undefined,
      tags: [],
    };
  }

  const {
    state,
    preview,
    isPreviewShowed,
    isPreviewLoading,
    isPreviewError,
    onSubmit,
    onError,
    showPreview,
  } = await useWorkshopForm<MagicItemCreate, MagicItemDetailResponse>(
    computed(() => ({
      actionUrl: '/api/v2/magic-items',
      getInitialState,
    })),
  );
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid grid-cols-24 gap-4"
    @error="onError"
    @submit="onSubmit"
  >
    <EditorBaseInfo
      v-model="state"
      section="magic-items"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробности</span>
    </USeparator>

    <MagicItemCategory v-model="state.category" />

    <MagicItemRarity v-model="state.rarity" />

    <MagicItemAttunement v-model="state.attunement" />

    <UFormField
      class="col-span-4"
      label="Проклятие"
      name="curse"
    >
      <UCheckbox
        v-model="state.curse"
        label="Есть"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Расходуемый"
      name="consumable"
    >
      <UCheckbox
        v-model="state.consumable"
        label="Да"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Количество зарядов"
      help="Введите количество зарядов магического предмета (если есть)"
      name="charges"
    >
      <UInput
        v-model="state.charges"
        type="number"
        placeholder="Введи количество зарядов"
        min="0"
        step="1"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Описание</span>
    </USeparator>

    <UFormField
      class="col-span-24"
      label="Описание"
      name="description"
    >
      <UTextarea
        v-model="state.description"
        :rows="8"
        placeholder="Введи описание"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Изображения</span>
    </USeparator>

    <UFormField
      class="col-span-8"
      label="Основное"
      help="Эта картинка отображается при просмотре страницы магического предмета"
      name="image"
    >
      <UploadImage
        v-model="state.image"
        section="magic-items"
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

    <EditorFormControls @preview="showPreview" />
  </UForm>

  <MagicItemPreview
    v-model="isPreviewShowed"
    :magic-item="preview"
    :is-loading="isPreviewLoading"
    :is-error="isPreviewError"
  />
</template>
