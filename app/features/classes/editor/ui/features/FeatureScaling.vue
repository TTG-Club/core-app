<script setup lang="ts">
  import type { ClassFeatureScalingCreate } from '../../../model';

  import { EditorArrayControls } from '~ui/editor';
  import { MarkupEditor } from '~ui/markup-editor';
  import { SelectLevel } from '~ui/select';

  const { isSubclass = false } = defineProps<{
    isSubclass?: boolean;
  }>();

  const state = defineModel<Array<ClassFeatureScalingCreate>>({
    required: true,
  });

  function addEmptyFeatureScaling() {
    state.value.push(getEmptyFeatureScaling());
  }

  function getEmptyFeatureScaling(): ClassFeatureScalingCreate {
    return {
      level: 1,
      name: '',
      description: '',
      additional: '',
      hideInSubclasses: false,
    };
  }
</script>

<template>
  <USeparator class="col-span-full my-2">
    <span class="font-bold text-secondary"> Масштабирование по уровням </span>
  </USeparator>

  <UForm
    v-for="(row, index) in state"
    :key="index"
    class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-24"
    attach
    :state="row"
  >
    <UFormField
      class="col-span-full md:col-span-4"
      label="Уровень"
      name="level"
    >
      <SelectLevel v-model="row.level" />
    </UFormField>

    <UFormField
      :class="
        isSubclass
          ? 'col-span-full md:col-span-12'
          : 'col-span-full md:col-span-8'
      "
      label="Название"
      name="name"
    >
      <UInput
        v-model="row.name"
        placeholder="Название уровня"
      />
    </UFormField>

    <UFormField
      v-if="!isSubclass"
      class="col-span-full md:col-span-4"
      label="Скрывать в подклассе?"
      name="hideInSubclasses"
    >
      <UCheckbox
        v-model="row.hideInSubclasses"
        description="Да"
      />
    </UFormField>

    <EditorArrayControls
      v-model="state"
      :item="row"
      :empty-object="getEmptyFeatureScaling()"
      :index="index"
      cols="8"
      only-remove
    />

    <UFormField
      class="col-span-full"
      label="Подсказка"
      name="additional"
    >
      <UInput
        v-model="row.additional"
        placeholder="Краткая подсказка"
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      label="Описание"
      name="description"
    >
      <MarkupEditor
        v-model="row.description"
        placeholder="Описание для уровня"
      />
    </UFormField>
  </UForm>

  <div
    v-if="!state.length"
    class="col-span-full flex justify-center"
  >
    <UButton @click.left.exact.prevent="addEmptyFeatureScaling">
      Добавить масштабирование
    </UButton>
  </div>
</template>
