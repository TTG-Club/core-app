<script setup lang="ts">
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectAbilities, SelectFeat, SelectSkill } from '~ui/select';

  import type { BackgroundCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<BackgroundCreate>({ required: true });

  const formRef = useTemplateRef('formRef');

  const validate = () => {
    return formRef.value?.validate();
  };

  defineExpose({
    validate,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state="form"
    :disabled="isCreating"
    class="grid grid-cols-24 gap-4"
  >
    <EditorBaseInfo
      v-model="form"
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
        v-model="form.abilityScores"
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
        v-model="form.skillsProficiencies"
        :limit="2"
      />
    </UFormField>

    <UFormField
      class="col-span-8"
      label="Черта"
      name="featUrl"
    >
      <SelectFeat v-model="form.featUrl" />
    </UFormField>

    <UFormField
      class="col-span-24"
      label="Владение инструментами"
      name="toolProficiency"
    >
      <UTextarea
        v-model="form.toolProficiency"
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
        v-model="form.equipment"
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
        v-model="form.description"
        :rows="8"
        placeholder="Введи описание"
      />
    </UFormField>
  </UForm>
</template>
