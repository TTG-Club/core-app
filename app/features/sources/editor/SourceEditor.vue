<script setup lang="ts">
  import { removeStopwords } from 'stopword';
  import { z } from 'zod';
  import { SourcePreview } from '~sources/preview';
  import { DatePicker } from '~ui/date-picker';
  import { EditorFormControls } from '~ui/editor';
  import { InputUrl } from '~ui/input';
  import { UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';

  import { SourceType } from './ui';

  import type { SourceCreate } from '~sources/types';

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
        name: undefined,
        date: undefined,
      },
      translation: {
        authors: undefined,
        date: undefined,
      },
    };
  }

  const { state, onSubmit, onError } = useWorkshopForm<SourceCreate>({
    actionUrl: '/api/v2/source',
    getInitialState,
  });

  const acronym = computed<string>(() => {
    const words = state.value.name.eng
      ?.split(' ')
      .map((word) => word.trim())
      .filter(Boolean);

    if (!words?.length) {
      return '';
    }

    return removeStopwords(words)
      .map((word) => word.at(0) || '')
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
    :schema="baseInfoSchema"
    class="grid gap-8"
    :state
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

      <div class="grid grid-cols-2 gap-6">
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

        <UFormField
          label="Акроним"
          help="Генерируется автоматически из английского названия"
          name="acronym"
        >
          <UInput
            v-model="state.acronym"
            :default-value="acronym"
            placeholder="Введи акроним"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <div class="grid grid-cols-12 gap-6">
        <UFormField
          class="col-span-full"
          label="Тип источника"
          name="type"
          required
        >
          <SourceType v-model="state.type" />
        </UFormField>

        <UFormField
          class="col-span-10"
          label="Издатель"
          name="publisher.name"
          required
        >
          <UInput
            v-model="state.publisher.name"
            placeholder="Введи название издателя"
          />
        </UFormField>

        <UFormField
          class="col-span-2"
          label="Дата публикации"
          name="publisher.date"
          required
        >
          <DatePicker v-model="state.publisher.date" />
        </UFormField>

        <UFormField
          class="col-span-10"
          label="Перевод"
          name="translation.authors"
          required
        >
          <UInputTags
            v-model="state.translation.authors"
            placeholder="Введи имена переводчиков"
          />
        </UFormField>

        <UFormField
          class="col-span-2"
          label="Дата перевода"
          name="translation.date"
          required
        >
          <DatePicker v-model="state.translation.date" />
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
          class="col-span-12"
          label="Основное"
          help="Эта картинка отображается при просмотре страницы источника"
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
