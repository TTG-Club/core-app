<script setup lang="ts">
  import type { ClassFeatureOptionCreate } from '../../../model';

  import { EditorArrayControls } from '~ui/editor';
  import { SelectLevel } from '~ui/select';

  const { isSubclass = false } = defineProps<{
    isSubclass?: boolean;
  }>();

  const state = defineModel<Array<ClassFeatureOptionCreate>>({
    required: true,
  });

  function addEmptyFeatureOption() {
    state.value.push(getEmptyFeatureOption());
  }

  function getEmptyFeatureOption(): ClassFeatureOptionCreate {
    return {
      name: {
        rus: '',
        eng: '',
      },
      description: '',
      additional: undefined,
      prerequisite: undefined,
      requiredClassLevel: undefined,
      hideInSubclasses: false,
    };
  }
</script>

<template>
  <USeparator class="col-span-full my-2">
    <span class="font-bold text-secondary">Опции умения</span>
  </USeparator>

  <UForm
    v-for="(option, index) in state"
    :key="index"
    class="col-span-full grid grid-cols-24 gap-4 rounded-lg border border-default bg-muted p-4"
    attach
    :state="option"
  >
    <UFormField
      class="col-span-8"
      label="Название"
      name="name.rus"
    >
      <UInput
        v-model="option.name.rus"
        placeholder="Название опции"
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Английское название"
      name="name.eng"
    >
      <UInput
        v-model="option.name.eng"
        placeholder="English name"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Уровень"
      name="requiredClassLevel"
    >
      <SelectLevel v-model="option.requiredClassLevel" />
    </UFormField>

    <UFormField
      v-if="!isSubclass"
      class="col-span-4"
      label="Скрыть в подклассе?"
      name="hideInSubclasses"
    >
      <UCheckbox
        v-model="option.hideInSubclasses"
        description="Да"
      />
    </UFormField>

    <EditorArrayControls
      v-model="state"
      :item="option"
      :empty-object="getEmptyFeatureOption()"
      :index="index"
      cols="8"
      only-remove
    />

    <UFormField
      class="col-span-12 col-start-1"
      label="Подсказка"
      name="additional"
    >
      <UInput
        v-model="option.additional"
        placeholder="Краткая подсказка"
      />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Требования"
      name="prerequisite"
    >
      <UInput
        v-model="option.prerequisite"
        placeholder="Требования к опции"
      />
    </UFormField>

    <UFormField
      class="col-span-full"
      label="Описание"
      name="description"
    >
      <UTextarea
        v-model="option.description"
        :rows="3"
        placeholder="Описание опции"
      />
    </UFormField>
  </UForm>

  <div
    v-if="!state.length"
    class="col-span-full flex justify-center"
  >
    <UButton @click.left.exact.prevent="addEmptyFeatureOption">
      Добавить опцию
    </UButton>
  </div>
</template>
