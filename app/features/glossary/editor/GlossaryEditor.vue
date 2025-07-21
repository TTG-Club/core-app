<script setup lang="ts">
  import { EditorBaseInfo } from '~ui/editor';

  import type { GlossaryCreate } from '~/shared/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<GlossaryCreate>({ required: true });

  const formRef = useTemplateRef('formRef');

  function validate() {
    return formRef.value?.validate();
  }

  defineExpose({
    validate,
  });
</script>

<template>
  <UForm
    ref="formRef"
    class="grid grid-cols-24 gap-4"
    :disabled="isCreating"
    :state="form"
  >
    <EditorBaseInfo
      v-model="form"
      section="glossary"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробная информация</span>
    </USeparator>

    <UFormField
      class="col-span-24"
      label="Категория тегов"
      help="Категория для записей глоссария"
    >
      <UInput
        v-model="form.tagCategory"
        placeholder="Введите категорию тегов"
      />
    </UFormField>

    <UFormField
      class="col-span-24"
      label="Описание"
      name="description"
      required
    >
      <UTextarea
        v-model="form.description"
        :rows="8"
        placeholder="Введи описание"
      />
    </UFormField>
  </UForm>
</template>
