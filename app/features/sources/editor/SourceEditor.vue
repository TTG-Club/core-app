<script setup lang="ts">
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SourcePreview } from '~/features/sources/preview';
  import type { SourceCreate } from '~/features/sources/types';
  import { UploadImage } from '~ui/upload';
  import SourceType from '~sources/editor/ui/SourceType.vue';

  function getInitialState(): SourceCreate {
    return {
      url: '',
      name: {
        rus: '',
        eng: '',
        alt: [],
      },
      acronym: '',
      type: '',
      image: '',
      source: {
        url: undefined,
        page: undefined,
      },
      description: '',
      tags: [],
      authors: '',
      published: '',
    };
  }

  const { state, onSubmit, onError } = useWorkshopForm<SourceCreate>({
    actionUrl: '/api/v2/source',
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
      section="sources"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <UFormField
        label="Акроним"
        help="Акроним генерируется автоматически при вводе английского названия"
        name="acronym"
        required
      >
        <UInput
          v-model="state.acronym"
          disabled
        />
      </UFormField>

      <UFormField
        label="Тип источника"
        name="type"
        required
      >
        <SourceType v-model="state.type" />
      </UFormField>

      <UFormField
        label="Дата публикации"
        name="published"
        required
      >
        <UInput
          v-model="state.published"
          placeholder="ДД.MM.ГГГГ"
        />
      </UFormField>

      <UFormField
        label="Перевод"
        name="published"
        required
      >
        <UInput
          v-model="state.published"
          placeholder="Введи переводчиков"
        />
      </UFormField>

      <UFormField
        label="Дата перевода"
        name="published"
        required
      >
        <UInput
          v-model="state.published"
          placeholder="ДД.MM.ГГГГ"
        />
      </UFormField>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
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
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Обложка</h2>
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
            section="sources"
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
        <SourcePreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
