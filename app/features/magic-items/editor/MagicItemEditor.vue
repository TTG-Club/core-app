<script setup lang="ts">
  import {
    MagicItemRarity,
    MagicItemAttunement,
    MagicItemCategory,
  } from './ui';

  import { EditorBaseInfo } from '~ui/editor';
  import { UploadImage } from '~ui/upload';

  import type { MagicItemCreate } from '~magic-items/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<MagicItemCreate>({ required: true });

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
      section="magic-item"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробности</span>
    </USeparator>

    <MagicItemCategory v-model="form.category" />

    <MagicItemRarity v-model="form.rarity" />

    <MagicItemAttunement v-model="form.attunement" />

    <UFormField
      class="col-span-4"
      label="Проклятие"
      name="curse"
    >
      <UCheckbox
        v-model="form.curse"
        label="Есть"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Расходуемый"
      name="consumable"
    >
      <UCheckbox
        v-model="form.consumable"
        label="Да"
      />
    </UFormField>

    <UFormField
      class="col-span-4"
      label="Количество зарядов"
      help="Введите количество зарядов магического предмета (если есть)"
      name="charges"
    >
      <UInput
        v-model="form.charges"
        type="number"
        placeholder="Введи количество зарядов"
        min="0"
        step="1"
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

    <USeparator>
      <span class="font-bold text-secondary">Изображения</span>
    </USeparator>

    <UFormField
      class="col-span-8"
      label="Основное"
      help="Эта картинка отображается при просмотре страницы магического предмета"
      name="image"
    >
      <UploadImage
        v-model="form.image"
        section="magic-item"
        max-size="480"
      />
    </UFormField>
  </UForm>
</template>
