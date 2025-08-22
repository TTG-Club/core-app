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

  const {
    state,
    preview,
    isPreviewShowed,
    isPreviewLoading,
    isPreviewError,
    onSubmit,
    onError,
    showPreview,
  } = await useWorkshopForm<FeatCreate, FeatDetailResponse>(
    computed(() => ({
      actionUrl: '/api/v2/feats',
      getInitialState,
    })),
  );
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid grid-cols-24 gap-4"
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      v-model="state"
      section="feats"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробности</span>
    </USeparator>

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

    <USeparator>
      <span class="font-bold text-secondary">Описание</span>
    </USeparator>

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

    <EditorFormControls @preview="showPreview" />
  </UForm>

  <FeatPreview
    v-model="isPreviewShowed"
    :feat="preview"
    :is-loading="isPreviewLoading"
    :is-error="isPreviewError"
  />
</template>
