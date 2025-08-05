<script setup lang="ts">
  import { EditorBaseInfo } from '~ui/editor';

  import type { GlossaryCreate } from '~/shared/types';
  import type { FormErrorEvent, FormSubmitEvent } from '#ui/types';
  import { z } from 'zod/v4';

  const emit = defineEmits<{
    (e: 'submit', v: GlossaryCreate): void;
    (e: 'error', v: FormErrorEvent): void;
  }>();

  const form = defineModel<GlossaryCreate>({ required: true });

  const formRef = useTemplateRef('formRef');
  const $toast = useToast();

  const schema = z.object({
    tagCategory: z.string().nonempty(),
    description: z.string().nonempty(),
  });

  defineExpose({
    submit: () => formRef.value!.submit(),
  });

  function onSubmit(payload: GlossaryCreate) {
    consola.log(payload);
  }

  function onError(err: FormErrorEvent) {
    consola.error(err);

    $toast.add({
      title: 'Ошибка валидации',
      description: 'Некоторые поля формы заполнены с ошибкой',
      color: 'error',
    });
  }
</script>

<template>
  <UForm
    ref="formRef"
    class="grid grid-cols-24 gap-4"
    :state="form"
    :schema
    @submit="onSubmit($event.data)"
    @error="onError"
  >
    <UButton type="submit">asd</UButton>

    <EditorBaseInfo
      ref="baseInfo"
      v-model="form"
      section="glossary"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробная информация</span>
    </USeparator>

    <UFormField
      class="col-span-24"
      label="Категория тегов"
      help="Категория для записей глоссария"
      name="tagCategory"
      required
    >
      <UInput
        v-model="form.tagCategory"
        placeholder="Введите категорию тегов"
      />
    </UFormField>

    <UFormField
      class="col-span-24"
      label="Описание"
      name="description"
      required
    >
      <UTextarea
        v-model="form.description"
        :rows="8"
        placeholder="Введи описание"
      />
    </UFormField>
  </UForm>
</template>
