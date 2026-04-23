<script setup lang="ts">
  import type { GlossaryCreate } from '~glossary/model';

  import { z } from 'zod/v4';

  import { GlossaryPreview } from '~glossary/preview';
  import { MarkupEditor } from '~markup/editor';
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { useWorkshopForm } from '~workshop/composable';

  const formRef = useTemplateRef('formRef');

  const schema = z.object({
    tagCategory: z.string().nonempty(),
    description: z.any(),
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
      description: { type: 'doc', content: [{ type: 'paragraph' }] },
      tags: [],
      tagCategory: '',
    };
  }

  const { state, onSubmit, onError } = useWorkshopForm<GlossaryCreate>({
    actionUrl: '/api/v2/glossary',
    getInitialState,
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
          <MarkupEditor v-model="state.description" />
        </UFormField>
      </div>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <GlossaryPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
