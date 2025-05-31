<script setup lang="ts">
  import { ValidationBase, ValidationDictionaries } from '~/shared/utils';
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectFeatCategory } from '~ui/select';

  import type { FormInstance } from 'ant-design-vue';
  import type { FeatCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<FeatCreate>({ required: true });

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
      section="feats"
    />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Подробности"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="6">
        <AFormItem
          label="Категория"
          :name="['category']"
          :rules="[ValidationDictionaries.ruleFeatCategories()]"
        >
          <SelectFeatCategory v-model="form.category" />
        </AFormItem>
      </ACol>

      <ACol :span="12">
        <AFormItem
          label="Предварительное условие"
          :name="['prerequisite']"
        >
          <AInput
            v-model:value="form.prerequisite"
            placeholder="Введи предварительное условие если есть"
            allow-clear
          />
        </AFormItem>
      </ACol>

      <ACol :span="6">
        <AFormItem
          label="Повторяемость"
          :name="['repeatability']"
        >
          <ACheckbox v-model:checked="form.repeatability">
            Можно брать несколько раз
          </ACheckbox>
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
