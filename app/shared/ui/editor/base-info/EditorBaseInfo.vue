<script setup lang="ts">
  import { z } from 'zod/v4';

  import { InputUrl } from '~ui/input';
  import { SelectSource, SelectTags } from '~ui/select';

  import type { EditorBaseInfoState } from './types';

  defineProps<{
    section: string;
  }>();

  const {
    params: { url: oldUrl },
  } = useRoute();

  const form = defineModel<EditorBaseInfoState>({ required: true });

  function handleBookChange(value: string | Array<string> | undefined) {
    if (typeof value !== 'string' && value !== undefined) {
      return;
    }

    if (value === undefined) {
      form.value.source.page = undefined;
    }

    form.value.source.url = value;
  }

  const schema = z.object({
    url: z.string().trim().nonempty(),
    tags: z.array(z.string().trim().nonempty()).optional(),
  });

  const nameSchema = z.object({
    rus: z.string().trim().nonempty(),
    eng: z.string().trim().nonempty(),
    alt: z.array(z.string().trim().nonempty()).optional(),
  });

  const sourceSchema = z.object({
    url: z
      .string()
      .trim()
      .nonempty()
      .optional()
      .refine(
        (value) => {
          if (!oldUrl) {
            return true;
          }

          return oldUrl === value;
        },
        {
          error: 'URL не совпадает со старым',
        },
      ),
    page: z.number().positive().optional(),
  });
</script>

<template>
  <div class="col-span-full flex flex-col gap-4">
    <USeparator>
      <span class="font-bold text-secondary">Основная информация</span>
    </USeparator>

    <UForm
      class="col-span-full grid grid-cols-3 place-items-stretch gap-4"
      :schema="nameSchema"
      :state="form.name"
      attach
    >
      <UFormField
        label="Название"
        name="rus"
        required
      >
        <UInput
          v-model="form.name.rus"
          placeholder="Введи название"
        />
      </UFormField>

      <UFormField
        label="Название (англ.)"
        name="eng"
        help="Английское название"
        required
      >
        <UInput
          v-model="form.name.eng"
          placeholder="Введи английское название"
        />
      </UFormField>

      <UFormField
        label="Название (альт.)"
        name="alt"
        help="Альтернативные названия. Используется для поиска и СЕО."
      >
        <SelectTags
          v-model="form.name.alt"
          placeholder="Введи альтернативные названия"
        />
      </UFormField>
    </UForm>

    <UForm
      class="col-span-full grid grid-cols-6 place-items-stretch gap-4"
      :schema="sourceSchema"
      :state="form.source"
      attach
    >
      <UFormField
        label="Источник"
        help="Книга, из которой взята информация о виде, если она существует"
        name="url"
        class="col-span-4"
      >
        <SelectSource
          :model-value="form.source.url"
          @update:model-value="handleBookChange"
        />
      </UFormField>

      <UFormField
        label="Страница в источнике"
        help="Номер страницы книги, откуда была взята информация о виде, если выбрана сама книга"
        name="page"
        class="col-span-2"
        :required="!!form.source.url"
      >
        <UInputNumber
          v-model="form.source.page"
          placeholder="Введи номер страницы"
          :disabled="!form.source.url"
          :min="1"
        />
      </UFormField>
    </UForm>

    <UForm
      class="col-span-full grid grid-cols-2 place-items-stretch gap-4"
      :schema="schema"
      :state="form"
      attach
    >
      <UFormField
        label="Теги"
        help="Используются для поиска и СЕО"
        name="tags"
      >
        <SelectTags
          v-model="form.tags"
          placeholder="Введи теги"
        />
      </UFormField>

      <UFormField
        label="URL"
        help="Менять только при необходимости, т.к. URL генерируется автоматически при вводе английского названия"
        name="url"
        required
      >
        <InputUrl
          v-model="form.url"
          :eng-name="form.name.eng"
          :source-url="form.source.url"
          :addon-before="`${getOrigin()}/${section}/`"
        />
      </UFormField>
    </UForm>
  </div>
</template>
