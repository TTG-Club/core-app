<script setup lang="ts">
  import { InputUrl } from '~ui/input';
  import { SelectSource } from '~ui/select';

  import type { EditorBaseInfoState } from './types';

  defineProps<{
    section: string;
  }>();

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

  const nameSchema = z.object({
    rus: z
      .string()
      .trim()
      .nonempty()
      .refine(
        (value) => {
          return !/[^0-9\u{0410}-\u{044F}\u{401}\u{0451}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}\u{003A}]/u.test(
            value,
          );
        },
        {
          error:
            'Допустимы только русские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, двоеточие, плюс, запятая и пробел',
        },
      ),
    eng: z
      .string()
      .trim()
      .nonempty()
      .refine(
        (value) => {
          return !/[^0-9\u{0041}-\u{005A}\u{0061}-\u{007A}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}\u{003A}]/u.test(
            value,
          );
        },
        {
          error:
            'Допустимы только английские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, двоеточие, плюс, запятая и пробел',
        },
      ),
    alt: z.array(z.string().trim().nonempty()).optional(),
  });

  const sourceSchema = computed(() =>
    z.object({
      url: z.string().trim().nonempty().optional(),
      page: form.value.source.url
        ? z.int().positive().min(1).max(1000)
        : z.undefined(),
    }),
  );

  const schema = computed(() =>
    z.object({
      url: z.string().trim().nonempty(),
      tags: z.array(z.string().trim().nonempty()).optional(),
      name: nameSchema,
    }),
  );

  defineExpose({ schema });
</script>

<template>
  <UCard
    variant="subtle"
    class="col-span-full"
  >
    <template #header>
      <h2 class="truncate text-base text-highlighted">Основная информация</h2>
    </template>

    <UForm
      attach
      :state="form"
      :schema="schema"
      class="grid grid-cols-2 gap-6"
    >
      <div class="flex flex-col gap-7">
        <UFormField
          label="Название"
          name="name.rus"
          required
        >
          <UInput
            v-model="form.name.rus"
            placeholder="Введи название"
          />
        </UFormField>

        <UFormField
          label="Английское название"
          name="name.eng"
          required
        >
          <UInput
            v-model="form.name.eng"
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
            v-model="form.url"
            :eng-name="form.name.eng"
            :source-url="form.source.url"
            disabled
          />
        </UFormField>
      </div>

      <div class="flex flex-col gap-1">
        <UFormField
          class="col-span-full"
          label="Альтернативные названия"
          name="name.alt"
          help="Используется для поиска и СЕО"
        >
          <UInputTags
            v-model="form.name.alt"
            placeholder="Введи альтернативные названия"
            add-on-paste
            add-on-blur
            add-on-tab
          />
        </UFormField>

        <UForm
          class="grid grid-cols-3 gap-4"
          :schema="sourceSchema"
          :state="form.source"
          attach
        >
          <UFormField
            label="Источник"
            help="Книга, из которой взята информация"
            name="url"
            class="col-span-2"
          >
            <SelectSource
              :model-value="form.source.url"
              @update:model-value="handleBookChange"
            />
          </UFormField>

          <UFormField
            label="Страница в источнике"
            help="Номер страницы книги"
            name="page"
            :required="!!form.source.url"
          >
            <UInputNumber
              v-model="form.source.page"
              placeholder="Страница"
              :disabled="!form.source.url"
              :min="1"
            />
          </UFormField>
        </UForm>

        <UFormField
          label="Теги"
          help="Используются для поиска и СЕО"
          name="tags"
        >
          <UInputTags
            v-model="form.tags"
            placeholder="Введи теги"
            add-on-paste
            add-on-blur
            add-on-tab
          />
        </UFormField>
      </div>
    </UForm>
  </UCard>
</template>
