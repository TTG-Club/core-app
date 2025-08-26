<script setup lang="ts">
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SelectFeatCategory } from '~ui/select';

  import type { FeatCreate, FeatDetailResponse } from '~/shared/types';
  import { FeatPreview } from '~feats/preview';

  const formRef = useTemplateRef('formRef');

  defineExpose({
    submit: () => formRef.value!.submit(),
  });

  function getInitialState(): FeatCreate {
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
      prerequisite: '',
      description: '',
      category: undefined,
      repeatability: false,
      tags: [],
    };
  }

  const { state, onSubmit, onError } = useWorkshopForm<FeatCreate>({
    actionUrl: '/api/v2/feats',
    getInitialState,
  });

  const {
    preview,
    isPreviewShowed,
    isPreviewLoading,
    isPreviewError,
    showPreview,
  } = useWorkshopPreview<FeatCreate, FeatDetailResponse>({
    actionUrl: '/api/v2/feats',
    state,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid gap-8"
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      v-model="state"
      section="feats"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <div class="grid grid-cols-24 gap-4">
        <UFormField
          class="col-span-6"
          label="Категория"
          name="category"
        >
          <SelectFeatCategory v-model="state.category" />
        </UFormField>

        <UFormField
          class="col-span-12"
          label="Предварительное условие"
          name="prerequisite"
        >
          <UInput
            v-model="state.prerequisite"
            placeholder="Введи предварительное условие если есть"
          />
        </UFormField>

        <UFormField
          class="col-span-6"
          label="Повторяемость"
          name="repeatability"
        >
          <UCheckbox
            v-model="state.repeatability"
            label="Можно брать несколько раз"
          />
        </UFormField>
      </div>
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

    <EditorFormControls @preview="showPreview" />
  </UForm>

  <FeatPreview
    v-model="isPreviewShowed"
    :feat="preview"
    :is-loading="isPreviewLoading"
    :is-error="isPreviewError"
  />
</template>
