<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectAbilities, SelectFeat, SelectSkill } from '~ui/select';

  import type { FormInstance } from 'ant-design-vue';
  import type { BackgroundCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<BackgroundCreate>({ required: true });

  const formRef = useTemplateRef<FormInstance>('formRef');

  defineExpose({
    validate: computed(() => formRef.value?.validate),
  });
</script>

<template>
  <AForm
    ref="formRef"
    layout="vertical"
    :model="form"
    :disabled="isCreating"
  >
    <EditorBaseInfo
      v-model="form"
      section="backgrounds"
    />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Подробности"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Характеристики"
          tooltip="В предыстории перечислены 3 из ваших характеристик персонажа. Увеличьте одну из них на 2, а другую на 1; или увеличьте каждую из 3 на 1."
          :name="['abilityScores']"
        >
          <SelectAbilities
            v-model="form.abilityScores"
            :limit="3"
            multiple
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Навыки"
          tooltip="Предыстория даёт вашему персонажу владение двумя определёнными навыками."
          :name="['skillsProficiencies']"
        >
          <SelectSkill
            v-model="form.skillsProficiencies"
            :limit="2"
          />
        </AFormItem>
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Черта"
          tooltip=""
          :name="['featUrl']"
        >
          <SelectFeat v-model="form.featUrl" />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Владение инструментами"
          :name="['toolProficiency']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="form.toolProficiency"
            :rows="3"
            placeholder="Введи инструменты"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Снаряжение"
          :name="['equipment']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="form.equipment"
            :rows="3"
            placeholder="Введи снаряжение"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Описание"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="24">
        <AFormItem
          label="Описание"
          :name="['description']"
          :rules="[ValidationBase.ruleString()]"
        >
          <ATextarea
            v-model:value="form.description"
            :rows="8"
            placeholder="Введи описание"
            allow-clear
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
