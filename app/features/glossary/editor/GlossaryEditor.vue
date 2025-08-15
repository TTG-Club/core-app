<script setup lang="ts">
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';

  import type { GlossaryCreate } from '~/shared/types';
  import { z } from 'zod/v4';

  const formRef = useTemplateRef('formRef');

  const schema = z.object({
    tagCategory: z.string().nonempty(),
    description: z.string().nonempty(),
  });

  defineExpose({
    submit: () => formRef.value!.submit(),
  });

  function getInitialState(): GlossaryCreate {
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
      tags: [],
      tagCategory: '',
    };
  }

  const { state, onSubmit, onError } = await useWorkshopForm<GlossaryCreate>(
    computed(() => ({
      actionUrl: '/api/v2/glossary',
      getInitialState,
    })),
  );
</script>

<template>
  <UForm
    ref="formRef"
    class="grid grid-cols-24 gap-4"
    :schema
    :state
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      ref="baseInfo"
      v-model="state"
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
        v-model="state.tagCategory"
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
        v-model="state.description"
        :rows="8"
        placeholder="Введи описание"
      />
    </UFormField>

    <EditorFormControls />
  </UForm>
</template>
