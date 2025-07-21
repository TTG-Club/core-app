<script setup lang="ts">
  import { EditorBaseInfo } from '~ui/editor';
  import { SelectFeatCategory } from '~ui/select';

  import type { FeatCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<FeatCreate>({ required: true });

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
      section="feats"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробности</span>
    </USeparator>

    <UFormField
      class="col-span-6"
      label="Категория"
      name="category"
    >
      <SelectFeatCategory v-model="form.category" />
    </UFormField>

    <UFormField
      class="col-span-12"
      label="Предварительное условие"
      name="prerequisite"
    >
      <UInput
        v-model="form.prerequisite"
        placeholder="Введи предварительное условие если есть"
      />
    </UFormField>

    <UFormField
      class="col-span-6"
      label="Повторяемость"
      name="repeatability"
    >
      <UCheckbox
        v-model="form.repeatability"
        label="Можно брать несколько раз"
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
