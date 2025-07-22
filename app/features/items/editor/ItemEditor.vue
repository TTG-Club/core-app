<script setup lang="ts">
  import { ItemType } from './ui';

  import { ValidationBase } from '~/shared/utils';
  import CoinsType from '~items/editor/ui/CoinsType.vue';
  import { EditorBaseInfo } from '~ui/editor';
  import { UploadImage } from '~ui/upload';

  import type { FormInstance } from 'ant-design-vue';
  import type { ItemCreate } from '~items/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<ItemCreate>({ required: true });

  const formRef = useTemplateRef<FormInstance>('formRef');

  watchEffect(() => {
    if (!form.value.category) {
      form.value.category = 'ITEM';
    }
  });

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
      section="item"
    />

    <ADivider orientation="left">
      <ATypographyText
        type="secondary"
        content="Подробности"
        strong
      />
    </ADivider>

    <AFormItem :name="['category']">
      <input
        v-model="form.category"
        type="hidden"
      />
    </AFormItem>

    <ARow :gutter="16">
      <ACol :span="8">
        <ItemType
          v-model="form.types"
          multiple
        />
      </ACol>

      <ACol :span="4">
        <AFormItem
          label="Количество монет"
          tooltip="Введите количество монет"
          :name="['cost']"
        >
          <AInputNumber
            v-model:value="form.cost"
            :precision="0"
            placeholder="Введи количество монет"
            min="0"
          />
        </AFormItem>
      </ACol>

      <ACol :span="4">
        <CoinsType v-model="form.coin" />
      </ACol>

      <ACol :span="8">
        <AFormItem
          label="Вес"
          :name="['weight']"
        >
          <AInput
            v-model:value="form.weight"
            placeholder="Введи вес"
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
          tooltip="Эта картинка отображается при просмотре страницы предмета"
          :name="['image']"
        >
          <UploadImage
            v-model="form.image"
            section="item"
            max-size="480"
          />
        </AFormItem>
      </ACol>
    </ARow>
  </AForm>
</template>
