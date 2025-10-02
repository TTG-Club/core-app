<script setup lang="ts">
  import { SelectLevel } from '~ui/select';
  import { EditorArrayControls } from '~ui/editor';
  import type { ClassFeatureCreate } from '~classes/types';
  import { FeatureScaling } from './ui';

  const state = defineModel<Array<ClassFeatureCreate>>({ required: true });

  function addEmptyFeature() {
    state.value.push(getEmptyFeature());
  }

  function getEmptyFeature(): ClassFeatureCreate {
    return {
      level: 1,
      name: '',
      description: '',
      additional: '',
      scaling: [],
    };
  }
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <h2 class="truncate text-base text-highlighted">Умения класса</h2>
    </template>

    <template
      v-for="(feat, index) in state"
      :key="index"
    >
      <UForm
        class="grid grid-cols-24 gap-4"
        attach
        :state="feat"
      >
        <UFormField
          class="col-span-8"
          label="Уровень"
          name="level"
        >
          <SelectLevel v-model="feat.level" />
        </UFormField>

        <UFormField
          class="col-span-8"
          label="Название"
          name="name"
        >
          <UInput
            v-model="feat.name"
            placeholder="Название умения"
          />
        </UFormField>

        <EditorArrayControls
          v-model="state"
          :item="feat"
          :empty-object="getEmptyFeature()"
          :index="index"
          cols="8"
          only-remove
        />

        <UFormField
          class="col-span-full"
          label="Описание"
          name="description"
        >
          <UTextarea
            v-model="feat.description"
            :rows="3"
            placeholder="Описание умения"
          />
        </UFormField>

        <FeatureScaling v-model="feat.scaling" />
      </UForm>

      <USeparator
        v-if="index < state.length - 1"
        class="my-4"
      />
    </template>

    <div
      v-if="!state.length"
      class="grid place-items-center py-2"
    >
      <UButton @click.left.exact.prevent="addEmptyFeature">
        Добавить умение
      </UButton>
    </div>
  </UCard>
</template>
