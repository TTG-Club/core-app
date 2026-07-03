<script setup lang="ts">
  import type { MagicItemCreate } from '~magic-items/model';

  import { MagicItemPreview } from '~magic-items/preview';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectItem } from '~ui/select';
  import { UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

  import {
    MagicItemAttunement,
    MagicItemCategory,
    MagicItemRarity,
  } from './ui';

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
      srdVersion: undefined,
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
      items: [],
      tags: [],
    };
  }

  const { state, submitState, onError, onSubmit, revisionControl } =
    useWorkshopForm<MagicItemCreate>({
      actionUrl: '/api/v2/magic-items',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.MAGIC_ITEM,
    });
</script>

<template>
  <UForm
    :state
    class="grid gap-8 pb-24"
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

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <MagicItemCategory v-model="state.category" />

        <MagicItemRarity v-model="state.rarity" />

        <MagicItemAttunement v-model="state.attunement" />

        <div class="flex flex-col gap-4 md:col-span-8 md:mt-4 lg:col-span-4">
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
          class="md:col-span-16 lg:col-span-8"
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
        <h2 class="truncate text-base text-highlighted">
          Немагические предметы
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4">
        <UFormField
          label="Связанные предметы"
          help="Выбери обычные предметы, на основе которых создан магический. Их вес и стоимость используются при экспорте в VTTG и для фильтра. Можно выбрать несколько."
          name="items"
        >
          <SelectItem
            v-model="state.items"
            multiple
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-1 gap-4">
        <UFormField name="description">
          <MarkupEditor
            v-model="state.description"
            placeholder="Введи описание"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Изображения</h2>
      </template>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-24">
        <UFormField
          class="md:col-span-12 lg:col-span-8"
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

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <MagicItemPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
