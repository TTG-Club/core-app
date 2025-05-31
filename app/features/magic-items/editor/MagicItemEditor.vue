<script setup lang="ts">
  import {
    MagicItemRarity,
    MagicItemAttunement,
    MagicItemCategory,
  } from './ui';

  import { ValidationBase } from '~/shared/utils';
  import { EditorBaseInfo } from '~ui/editor';
  import { UploadImage } from '~ui/upload';

  import type { FormInstance } from 'ant-design-vue';
  import type { MagicItemCreate } from '~magic-items/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<MagicItemCreate>({ required: true });

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
      section="magic-item"
    />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Подробности"
        strong
      />
    </ADivider>

    <MagicItemCategory v-model="form.category" />

    <MagicItemRarity v-model="form.rarity" />

    <MagicItemAttunement v-model="form.attunement" />

    <ARow :gutter="16">
      <ACol :span="4">
        <AFormItem
          label="Проклятие"
          :name="['curse']"
        >
          <ACheckbox v-model:checked="form.curse"> Есть </ACheckbox>
        </AFormItem>
      </ACol>

      <ACol :span="4">
        <AFormItem
          label="Расходуемый"
          :name="['consumable']"
        >
          <ACheckbox v-model:checked="form.consumable"> Да </ACheckbox>
        </AFormItem>
      </ACol>

      <ACol :span="4">
        <AFormItem
          label="Количество зарядов"
          tooltip="Введите количество зарядов магического предмета (если есть)"
          :name="['charges']"
        >
          <AInputNumber
            v-model:value="form.charges"
            :precision="0"
            placeholder="Введи количество зарядов"
            min="0"
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

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Изображения"
        strong
      />
    </ADivider>

    <ARow :gutter="16">
      <ACol :span="8">
        <AFormItem
          label="Основное"
          tooltip="Эта картинка отображается при просмотре страницы магического предмета"
          :name="['image']"
        >
          <UploadImage
            v-model="form.image"
            section="magic-item"
            max-size="480"
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
