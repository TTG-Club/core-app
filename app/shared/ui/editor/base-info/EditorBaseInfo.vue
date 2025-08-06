<script setup lang="ts">
  import { InputUrl } from '~ui/input';
  import { SelectSource } from '~ui/select';

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

  const nameSchema = z.object({
    rus: z
      .string()
      .trim()
      .nonempty()
      .refine(
        (value) => {
          return !/[^0-9\u{0410}-\u{044F}\u{401}\u{0451}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}]/u.test(
            value,
          );
        },
        {
          error:
            'Допустимы только русские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, плюс, запятая и пробел',
        },
      ),
    eng: z
      .string()
      .trim()
      .nonempty()
      .refine(
        (value) => {
          return !/[^0-9\u{0041}-\u{005A}\u{0061}-\u{007A}\u{0020}\u{0027}\u{2010}-\u{2014}\u{002D}\u{0028}\u{0029}\u{002F}\u{002B}\u{002C}]/u.test(
            value,
          );
        },
        {
          error:
            'Допустимы только английские буквы, арабские цифры, круглые скобки, косая черта, дефис, апостроф, плюс, запятая и пробел',
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
      url: oldUrl
        ? z
            .string()
            .trim()
            .nonempty()
            .refine((value) => oldUrl === value, {
              error: 'URL не совпадает со старым',
            })
        : z.string().trim().nonempty(),
      tags: z.array(z.string().trim().nonempty()).optional(),
      name: nameSchema,
    }),
  );

  defineExpose({ schema });
</script>

<template>
  <UForm
    attach
    :state="form"
    :schema="schema"
    class="col-span-full grid grid-cols-3 gap-4"
  >
    <USeparator>
      <span class="font-bold text-secondary">Основная информация</span>
    </USeparator>

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
      label="Название (англ.)"
      name="name.eng"
      help="Английское название"
      required
    >
      <UInput
        v-model="form.name.eng"
        placeholder="Введи английское название"
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
        disabled
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      label="Название (альт.)"
      name="name.alt"
      help="Альтернативные названия. Используется для поиска и СЕО."
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
      class="col-span-full grid grid-cols-3 place-items-stretch gap-4"
      :schema="sourceSchema"
      :state="form.source"
      attach
    >
      <UFormField
        label="Источник"
        help="Книга, из которой взята информация о виде, если она существует"
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
        help="Номер страницы книги, откуда была взята информация о виде, если выбрана сама книга"
        name="page"
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

    <UFormField
      class="col-span-full"
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
  </UForm>
</template>
