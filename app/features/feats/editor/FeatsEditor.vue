<script setup lang="ts">
  import type { FeatCreate } from '~feats/model';

  import { FeatPreview } from '~feats/preview';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectAbilities, SelectFeatCategory } from '~ui/select';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

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
      srdVersion: undefined,
      prerequisite: '',
      description: '',
      category: undefined,
      repeatability: false,
      abilities: [],
      tags: [],
    };
  }

  const { state, submitState, onSubmit, onError, revisionControl } =
    useWorkshopForm<FeatCreate>({
      actionUrl: '/api/v2/feats',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.FEAT,
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

      <div class="grid grid-cols-1 gap-4 pb-24 md:grid-cols-24">
        <UFormField
          class="md:col-span-8 lg:col-span-6"
          label="Категория"
          name="category"
        >
          <SelectFeatCategory v-model="state.category" />
        </UFormField>

        <UFormField
          class="md:col-span-16 lg:col-span-12"
          label="Предварительное условие"
          name="prerequisite"
        >
          <UInput
            v-model="state.prerequisite"
            placeholder="Введи предварительное условие если есть"
          />
        </UFormField>

        <UFormField
          class="md:col-span-12 lg:col-span-6"
          label="Повторяемость"
          name="repeatability"
        >
          <UCheckbox
            v-model="state.repeatability"
            label="Можно брать несколько раз"
          />
        </UFormField>

        <UFormField
          class="md:col-span-12 lg:col-span-6"
          label="Улучшаемые характеристики"
          name="abilities"
        >
          <SelectAbilities
            v-model="state.abilities"
            :limit="6"
            multiple
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <div class="grid grid-cols-1 gap-4">
        <UFormField
          label="Описание"
          name="description"
        >
          <MarkupEditor
            v-model="state.description"
            placeholder="Введи описание"
          />
        </UFormField>
      </div>
    </UCard>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <FeatPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
