<script setup lang="ts">
  import {
    MagicItemRarity,
    MagicItemAttunement,
    MagicItemCategory,
  } from './ui';

  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { UploadImage } from '~ui/upload';

  import type { MagicItemCreate } from '~magic-items/types';
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

  const { state, onError, onSubmit } = useWorkshopForm<MagicItemCreate>({
    actionUrl: '/api/v2/magic-items',
    getInitialState,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid gap-8"
    @error="onError"
    @submit="onSubmit"
  >
    <EditorBaseInfo
      v-model="state"
      section="magic-items"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <MagicItemCategory v-model="state.category" />

        <MagicItemRarity v-model="state.rarity" />

        <MagicItemAttunement v-model="state.attunement" />

        <div class="col-span-4 mt-4 flex flex-col gap-4">
          <UFormField name="curse">
            <UCheckbox
              v-model="state.curse"
              label="Проклятие"
            />
          </UFormField>

          <UFormField name="consumable">
            <UCheckbox
              v-model="state.consumable"
              label="Расходуемый"
            />
          </UFormField>
        </div>

        <UFormField
          class="col-span-8"
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
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-24"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            :rows="8"
            placeholder="Введи описание"
          />
        </UFormField>
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
      </div>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <MagicItemPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
