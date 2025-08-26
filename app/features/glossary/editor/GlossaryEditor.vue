<script setup lang="ts">
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';

  import type { GlossaryCreate, GlossaryDetailResponse } from '~/shared/types';
  import { z } from 'zod/v4';
  import { GlossaryPreview } from '~glossary/preview';

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

  const { state, onSubmit, onError } = useWorkshopForm<GlossaryCreate>({
    actionUrl: '/api/v2/glossary',
    getInitialState,
  });

  const {
    preview,
    isPreviewShowed,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview<GlossaryCreate, GlossaryDetailResponse>({
    actionUrl: '/api/v2/glossary',
    state,
  });
</script>

<template>
  <UForm
    ref="formRef"
    class="grid gap-8"
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

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">
          Подробная информация
        </h2>
      </template>

      <div class="grid gap-6">
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
      </div>
    </UCard>

    <EditorFormControls @preview="showPreview" />
  </UForm>

  <GlossaryPreview
    v-model="isPreviewShowed"
    :glossary="preview"
    :is-loading="isPreviewLoading"
    :is-error="isPreviewError"
  />
</template>
