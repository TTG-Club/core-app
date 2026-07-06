<script setup lang="ts">
  import type { GlossaryCreate } from '~glossary/model';

  import { z } from 'zod/v4';

  import { GlossaryPreview } from '~glossary/preview';
  import { EditorBaseInfo } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { useWorkshopForm } from '~workshop/composable';
  import { REVISION_ENTITY_TYPES } from '~workshop/revision/model';
  import { WorkshopEditorFormControls } from '~workshop/revision/ui';

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
      srdVersion: undefined,
      description: '',
      tags: [],
      tagCategory: '',
    };
  }

  const { state, submitState, onSubmit, onError, revisionControl } =
    useWorkshopForm<GlossaryCreate>({
      actionUrl: '/api/v2/glossary',
      getInitialState,
      revisionEntityType: REVISION_ENTITY_TYPES.GLOSSARY,
    });
</script>

<template>
  <UForm
    ref="formRef"
    class="grid gap-8 pb-24"
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
          <MarkupEditor
            v-model="state.description"
            placeholder="Введи описание"
          />
        </UFormField>
      </div>
    </UCard>

    <WorkshopEditorFormControls :revision-control>
      <template #preview="{ opened, changeVisibility }">
        <GlossaryPreview
          :open="opened"
          :state="submitState"
          @update:open="changeVisibility"
        />
      </template>
    </WorkshopEditorFormControls>
  </UForm>
</template>
