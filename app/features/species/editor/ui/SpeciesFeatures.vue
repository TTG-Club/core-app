<script setup lang="ts">
  import type { SpeciesCreate } from '~species/model';

  import { createFeatEditorRows } from '~feats/model';
  import {
    SPECIES_CHARACTER_LEVEL,
    SPECIES_FEATURE_EDITOR,
  } from '~species/model';
  import { EditorArrayControls } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';

  import SpeciesMechanicsFields from './SpeciesMechanicsFields.vue';

  type Features = SpeciesCreate['features'];

  /**
   * Пустое умение: без уровня и без механики — текстовое, пока их не заполнят.
   *
   * @returns новое умение формы.
   */
  function getEmptyFeature(): Features[number] {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
      level: undefined,
      mechanics: undefined,
      editorRows: createFeatEditorRows(),
    };
  }

  const model = defineModel<Features>({
    default: () => [],
  });

  /**
   * Последнее ли умение в списке: за ним разделитель не нужен.
   *
   * @param index индекс умения.
   * @returns истина для последнего умения.
   */
  function isLastFeature(index: number): boolean {
    return index === model.value.length - 1;
  }

  /**
   * Вставляет пустое умение в указанную позицию.
   *
   * @param indexOfNewFeature позиция нового умения.
   */
  function addFeature(indexOfNewFeature: number): void {
    model.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }
</script>

<template>
  <USeparator class="col-span-full">
    <span class="font-bold text-secondary">
      {{ SPECIES_FEATURE_EDITOR.title }}
    </span>
  </USeparator>

  <template
    v-for="(feature, featIndex) in model"
    :key="featIndex"
  >
    <UForm
      class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
      attach
      :state="feature"
    >
      <UFormField
        class="col-span-full md:col-span-8"
        label="Название"
        name="name.rus"
      >
        <UInput
          v-model="feature.name.rus"
          placeholder="Введи название"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-8"
        label="Название (англ.)"
        help="Английское название"
        name="name.eng"
      >
        <UInput
          v-model="feature.name.eng"
          placeholder="Введи английское название"
        />
      </UFormField>

      <EditorArrayControls
        v-model="model"
        :item="feature"
        :empty-object="getEmptyFeature()"
        :index="featIndex"
        cols="8"
        only-remove
      />

      <UFormField
        class="col-span-full md:col-span-4"
        :label="SPECIES_FEATURE_EDITOR.levelLabel"
        :help="SPECIES_FEATURE_EDITOR.levelHelp"
        name="level"
      >
        <UInputNumber
          v-model="feature.level"
          :placeholder="SPECIES_FEATURE_EDITOR.levelPlaceholder"
          :min="SPECIES_CHARACTER_LEVEL.minimum"
          :max="SPECIES_CHARACTER_LEVEL.maximum"
        />
      </UFormField>

      <UFormField
        class="col-span-full"
        label="Описание"
        name="description"
      >
        <MarkupEditor
          v-model="feature.description"
          placeholder="Введи описание"
        />
      </UFormField>

      <USeparator class="col-span-full">
        <span class="font-bold text-secondary">
          {{ SPECIES_FEATURE_EDITOR.mechanicsTitle }}
        </span>
      </USeparator>

      <SpeciesMechanicsFields v-model="feature.editorRows" />
    </UForm>

    <USeparator
      v-if="!isLastFeature(featIndex)"
      class="col-span-full"
    />
  </template>

  <div
    v-if="!model.length"
    class="col-span-full flex justify-center"
  >
    <UButton @click.left.exact.prevent="addFeature(0)">
      {{ SPECIES_FEATURE_EDITOR.addFirstLabel }}
    </UButton>
  </div>
</template>
