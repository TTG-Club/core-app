<script setup lang="ts">
  import { EditorArrayControls } from '~ui/editor';

  import type { SpeciesCreate } from '~/shared/types';

  type Features = SpeciesCreate['features'];

  function getEmptyFeature(): Features[number] {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
    };
  }

  const model = defineModel<Features>({
    default: () => [],
  });

  function isLastFeature(index: number) {
    return index === model.value.length - 1;
  }

  function addFeature(indexOfNewFeature: number) {
    model.value.splice(indexOfNewFeature, 0, getEmptyFeature());
  }
</script>

<template>
  <USeparator>
    <span class="font-bold text-secondary">Умения</span>
  </USeparator>

  <template
    v-for="(feature, featIndex) in model"
    :key="featIndex"
  >
    <UForm
      class="col-span-full grid grid-cols-24 gap-4"
      attach
      :state="feature"
    >
      <UFormField
        class="col-span-8"
        label="Название"
        name="name.rus"
      >
        <UInput
          v-model="feature.name.rus"
          placeholder="Введи название"
        />
      </UFormField>

      <UFormField
        class="col-span-8"
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
        class="col-span-24"
        label="Описание"
        name="description"
      >
        <UTextarea
          v-model="feature.description"
          :rows="3"
          placeholder="Введи описание"
        />
      </UFormField>
    </UForm>

    <USeparator v-if="!isLastFeature(featIndex)" />
  </template>

  <div
    v-if="!model.length"
    class="col-span-full flex justify-center"
  >
    <UButton @click.left.exact.prevent="addFeature(0)">
      Добавить первое умение
    </UButton>
  </div>
</template>
