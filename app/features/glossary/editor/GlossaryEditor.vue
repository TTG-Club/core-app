<script setup lang="ts">
  import { ValidationBase } from '~/shared/utils';
  import { EditorBaseInfo } from '~ui/editor';

  import type { FormInstance } from 'ant-design-vue';
  import type { GlossaryCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<GlossaryCreate>({ required: true });

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
      section="glossary"
    />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Подробная информация"
        strong
      />
    </ADivider>

    <ACol :span="12">
      <AFormItem
        label="Категория тегов"
        tooltip="Категория для записей глоссария"
        :name="['tagCategory']"
      >
        <AInput
          v-model:value="form.tagCategory"
          placeholder="Введите категорию тегов"
        />
      </AFormItem>
    </ACol>

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
