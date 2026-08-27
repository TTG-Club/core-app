<script setup lang="ts">
  import type { SpeciesFeatureCreate } from '../../model';

  import { createFeatEditorRows, createFeatMechanics } from '~feats/model';
  import { EditorArrayControls } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';

  import {
    SPECIES_EDITOR_LABELS,
    SPECIES_EDITOR_TABS,
    SPECIES_FEATURE_LEVEL,
  } from '../../model';
  import SpeciesFeatureMechanics from './SpeciesFeatureMechanics.vue';

  /**
   * Пустое умение вида. Механика и строки редактора здесь всегда объекты:
   * загрузка сливает ответ сервера именно с этим состоянием, и недостающие
   * блоки берутся отсюда.
   *
   * @returns новое умение формы.
   */
  function getEmptyFeature(): SpeciesFeatureCreate {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
      level: undefined,
      grantedSpells: [],
      mechanics: createFeatMechanics(),
      activeEffects: [],
      editorRows: createFeatEditorRows(),
    };
  }

  const model = defineModel<Array<SpeciesFeatureCreate>>({
    default: () => [],
  });

  function isLastFeature(index: number): boolean {
    return index === model.value.length - 1;
  }

  function addFeature(indexOfNewFeature: number): void {
    model.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }
</script>

<template>
  <USeparator class="col-span-full">
    <span class="font-bold text-secondary">
      {{ SPECIES_EDITOR_TABS.features }}
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
        class="col-span-full md:col-span-7"
        label="Название"
        name="name.rus"
      >
        <UInput
          v-model="feature.name.rus"
          placeholder="Введи название"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-7"
        label="Название (англ.)"
        help="Английское название"
        name="name.eng"
      >
        <UInput
          v-model="feature.name.eng"
          placeholder="Введи английское название"
        />
      </UFormField>

      <UFormField
        class="col-span-full md:col-span-4"
        :label="SPECIES_EDITOR_LABELS.featureLevel"
        :help="SPECIES_EDITOR_LABELS.featureLevelHint"
        name="level"
      >
        <UInputNumber
          v-model="feature.level"
          :min="SPECIES_FEATURE_LEVEL.min"
          :max="SPECIES_FEATURE_LEVEL.max"
        />
      </UFormField>

      <EditorArrayControls
        v-model="model"
        :item="feature"
        :empty-object="getEmptyFeature()"
        :index="featIndex"
        cols="6"
        only-remove
      />

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

      <SpeciesFeatureMechanics v-model="model[featIndex]!" />
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
      {{ SPECIES_EDITOR_LABELS.featureFirst }}
    </UButton>
  </div>
</template>
