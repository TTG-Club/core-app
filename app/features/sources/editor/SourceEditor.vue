<script setup lang="ts">
  import { computed, watchEffect } from 'vue';
  import { z } from 'zod';
  import { EditorFormControls } from '~ui/editor';
  import { InputUrl } from '~ui/input';
  import { UploadImage } from '~ui/upload';

  import SourceType from '~/features/sources/editor/ui/SourceType.vue';
  import { SourcePreview } from '~/features/sources/preview';

  import type { SourceCreate } from '~/features/sources/types';

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
      publisher: {
        name: '',
        published: '',
      },
      translation: {
        authors: '',
        translationDate: '',
      },
    };
  }

  const { state, onSubmit, onError } = useWorkshopForm<SourceCreate>({
    actionUrl: '/api/v2/source',
    getInitialState,
  });

  const MINOR_WORDS = new Set([
    'a',
    'an',
    'and',
    'as',
    'at',
    'by',
    'for',
    'from',
    'in',
    'into',
    'nor',
    'of',
    'on',
    'or',
    'over',
    'the',
    'to',
    'under',
    'with',
    'vs',
    'via',
  ]);

  const acronym = computed<string>(() => {
    const value = state.value.name.eng?.trim();

    if (!value) {
      return '';
    }

    const words = value.match(/[A-Z0-9]+(?:'[A-Z0-9]+)*/gi) ?? [];

    return words
      .map((word, index) => {
        const firstChar = word.charAt(0);

        if (!firstChar) {
          return '';
        }

        const lowerWord = word.toLowerCase();

        if (index === 0) {
          return firstChar.toUpperCase();
        }

        if (MINOR_WORDS.has(lowerWord)) {
          return firstChar.toLowerCase();
        }

        return firstChar.toUpperCase();
      })
      .join('');
  });

  watchEffect(() => {
    state.value.acronym = acronym.value;
  });

  // === Локальная схема "Основной информации" (без source/page) ===
  const nameSchema = z.object({
    rus: z.string().trim().nonempty(),
    eng: z.string().trim().nonempty(),
    alt: z.array(z.string().trim().nonempty()).optional(),
  });

  const baseInfoSchema = computed(() =>
    z.object({
      url: z.string().trim().nonempty(),
      tags: z.array(z.string().trim().nonempty()).optional(),
      name: nameSchema,
      acronym: z.string().trim().nonempty(),
    }),
  );
</script>

<template>
  <UForm
    :state
    class="grid gap-8"
    @submit="onSubmit"
    @error="onError"
  >
    <UCard
      variant="subtle"
      class="col-span-full"
    >
      <template #header>
        <h2 class="truncate text-base text-highlighted">Основная информация</h2>
      </template>

      <UForm
        attach
        :state="state"
        :schema="baseInfoSchema"
        class="grid grid-cols-2 gap-6"
      >
        <div class="flex flex-col gap-7">
          <UFormField
            label="Название"
            name="name.rus"
            required
          >
            <UInput
              v-model="state.name.rus"
              placeholder="Введи название"
            />
          </UFormField>

          <UFormField
            label="Английское название"
            name="name.eng"
            required
          >
            <UInput
              v-model="state.name.eng"
              placeholder="Введи английское название"
            />
          </UFormField>

          <UFormField
            label="URL"
            help="URL генерируется автоматически при вводе английского названия"
            name="url"
            required
          >
            <InputUrl
              v-model="state.url"
              :eng-name="state.name.eng"
              :source-url="undefined"
              disabled
            />
          </UFormField>
        </div>

        <div class="flex flex-col gap-7">
          <UFormField
            label="Акроним"
            help="Генерируется автоматически из английского названия"
            name="acronym"
          >
            <UInput
              :model-value="acronym"
              disabled
            />
          </UFormField>
        </div>
      </UForm>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <UFormField
        label="Тип источника"
        name="type"
        required
      >
        <SourceType v-model="state.type" />
      </UFormField>

      <UFormField
        label="Издатель"
        name="publisher"
        required
      >
        <UInput
          v-model="state.publisher.name"
          placeholder="Издатель"
        />
      </UFormField>

      <UFormField
        label="Дата публикации"
        name="published"
        required
      >
        <UInput
          v-model="state.publisher.published"
          placeholder="ДД.MM.ГГГГ"
        />
      </UFormField>

      <UFormField
        label="Перевод"
        name="translation"
        required
      >
        <UInput
          v-model="state.translation.authors"
          placeholder="Введи переводчиков"
        />
      </UFormField>

      <UFormField
        label="Дата перевода"
        name="published"
        required
      >
        <UInput
          v-model="state.translation.translationDate"
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
                <img
                  v-if="isLoaded"
                  v-bind="imgAttrs"
                  class="w-full rounded-lg object-contain"
                  :src="src"
                  :alt="state.name.rus"
                />

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
