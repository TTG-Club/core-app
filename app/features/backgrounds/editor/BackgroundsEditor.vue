<script setup lang="ts">
  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { SelectAbilities, SelectFeat, SelectSkill } from '~ui/select';

  import type { BackgroundCreate } from '~/shared/types';

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });

  function getInitialState(): BackgroundCreate {
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
      description: '',
      abilityScores: [],
      featUrl: undefined,
      skillsProficiencies: [],
      toolProficiency: '',
      equipment: '',
      tags: [],
    };
  }

  const { state, onSubmit, onError } = await useWorkshopForm<BackgroundCreate>(
    computed(() => ({
      actionUrl: '/api/v2/backgrounds',
      getInitialState,
    })),
  );
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid grid-cols-24 gap-4"
    @submit="onSubmit"
    @error="onError"
  >
    <EditorBaseInfo
      v-model="state"
      section="backgrounds"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробности</span>
    </USeparator>

    <UFormField
      class="col-span-8"
      label="Характеристики"
      help="В предыстории перечислены 3 из ваших характеристик персонажа. Увеличьте одну из них на 2, а другую на 1; или увеличьте каждую из 3 на 1."
      name="abilityScores"
    >
      <SelectAbilities
        v-model="state.abilityScores"
        :limit="3"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Навыки"
      help="Предыстория даёт вашему персонажу владение двумя определёнными навыками."
      name="skillsProficiencies"
    >
      <SelectSkill
        v-model="state.skillsProficiencies"
        :limit="2"
        multiple
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Черта"
      name="featUrl"
    >
      <SelectFeat v-model="state.featUrl" />
    </UFormField>

    <UFormField
      class="col-span-24"
      label="Владение инструментами"
      name="toolProficiency"
    >
      <UTextarea
        v-model="state.toolProficiency"
        :rows="3"
        placeholder="Введи инструменты"
      />
    </UFormField>

    <UFormField
      class="col-span-24"
      label="Снаряжение"
      name="equipment"
    >
      <UTextarea
        v-model="state.equipment"
        :rows="3"
        placeholder="Введи снаряжение"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Описание</span>
    </USeparator>

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

    <EditorFormControls />
  </UForm>
</template>
