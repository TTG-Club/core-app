<script setup lang="ts">
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SelectAbilities, SelectFeatCategory } from '~ui/select';

  import type { FeatCreate } from '~/shared/types';
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
      abilities: [],
      tags: [],
    };
  }

  const { state, onSubmit, onError } = useWorkshopForm<FeatCreate>({
    actionUrl: '/api/v2/feats',
    getInitialState,
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

        <UFormField
          class="col-span-6"
          label="Улучшаемые характеристики"
          name="abilities"
        >
          <SelectAbilities
            v-model="state.abilities"
            :limit="3"
            multiple
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

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <FeatPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
