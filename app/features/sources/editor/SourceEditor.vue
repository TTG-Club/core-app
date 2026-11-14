<script setup lang="ts">
  import type { SourceCreate } from '~sources/types';

  import { removeStopwords } from 'stopword';
  import { z } from 'zod';

  import { SourcePreview } from '~sources/preview';
  import {
    SOURCE_ACRONYM_HELP,
    SOURCE_ACRONYM_RESTORE_ICON,
    SOURCE_ACRONYM_RESTORE_LABEL,
  } from '~sources/types';
  import { DatePicker } from '~ui/date-picker';
  import { EditorFormControls } from '~ui/editor';
  import { InputUrl } from '~ui/input';
  import { MarkupEditor } from '~ui/markup-editor';
  import { UploadImage } from '~ui/upload';
  import { useWorkshopForm } from '~workshop/composable';

  import { SourceType } from './ui';

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
      srdVersion: undefined,
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

  const { state, submitState, onSubmit, onError } =
    useWorkshopForm<SourceCreate>({
      actionUrl: '/api/v2/source',
      getInitialState,
    });

  const route = useRoute();

  // У сохранённого источника акроним — его идентификатор: сам он за названием
  // уже не идёт, меняется только рукой.
  const isEditForm = computed(
    () => typeof route.params.url === 'string' && !!route.params.url,
  );

  /** Акроним по первым буквам английского названия, без служебных слов. */
  const generatedAcronym = computed<string>(() => {
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

  // Кнопка возврата нужна, только когда есть что возвращать: акроним из
  // названия собрался и в поле стоит не он.
  const isAcronymRestorable = computed(
    () =>
      !!generatedAcronym.value
      && state.value.acronym !== generatedAcronym.value,
  );

  // Акроним идёт за названием, пока его не правили рукой: поле пустое или в
  // нём стоит прежний подставленный вариант. Введённое вручную не трогаем.
  watch(generatedAcronym, (nextAcronym, previousAcronym) => {
    if (isEditForm.value) {
      return;
    }

    if (!state.value.acronym || state.value.acronym === previousAcronym) {
      state.value.acronym = nextAcronym;
    }
  });

  /** Возвращает в поле акроним, собранный из английского названия. */
  function restoreGeneratedAcronym(): void {
    state.value.acronym = generatedAcronym.value;
  }

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
    class="grid gap-8 pb-24"
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
          :help="SOURCE_ACRONYM_HELP"
          name="acronym"
          required
        >
          <UInput
            v-model="state.acronym"
            placeholder="Введи акроним"
            :ui="{ trailing: 'pe-0.5' }"
          >
            <template
              v-if="isAcronymRestorable"
              #trailing
            >
              <UButton
                :icon="SOURCE_ACRONYM_RESTORE_ICON"
                variant="link"
                color="neutral"
                size="sm"
                :title="SOURCE_ACRONYM_RESTORE_LABEL"
                :aria-label="SOURCE_ACRONYM_RESTORE_LABEL"
                @click.left.exact.prevent="restoreGeneratedAcronym"
              />
            </template>
          </UInput>
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
          <UInput
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
          <MarkupEditor
            v-model="state.description"
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
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
