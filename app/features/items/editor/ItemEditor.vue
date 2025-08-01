<script setup lang="ts">
  import { ItemType } from './ui';

  import CoinsType from '~/features/items/editor/ui/CoinsType.vue';
  import { EditorBaseInfo } from '~ui/editor';
  import { UploadImage } from '~ui/upload';

  import type { ItemCreate } from '~/features/items/types';

  const { isCreating } = defineProps<{
    isCreating: boolean;
  }>();

  const form = defineModel<ItemCreate>({ required: true });

  const formRef = useTemplateRef('formRef');

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
  <UForm
    ref="formRef"
    layout="vertical"
    :model="form"
    :disabled="isCreating"
  >
    <EditorBaseInfo
      v-model="form"
      section="item"
    />

    <USeparator>
      <span class="font-bold text-secondary">Подробности</span>
    </USeparator>

    <UFormField>
      <input
        v-model="form.category"
        type="hidden"
        name="['category']"
      />
    </UFormField>

    <ItemType
      v-model="form.types"
      multiple
    />

    <UFormField
      label="Количество монет"
      tooltip="Введите количество монет"
      name="['cost']"
    >
      <UInput
        v-model:value="form.cost"
        :precision="0"
        placeholder="Введи количество монет"
        min="0"
      />
    </UFormField>

    <CoinsType v-model="form.coin" />

    <UFormField
      label="Вес"
      name="weight"
    >
      <UInput
        v-model:value="form.weight"
        placeholder="Введи вес"
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Описание</span>
    </USeparator>

    <UFormField
      label="Описание"
      name="description"
    >
      <UTextarea
        v-model:value="form.description"
        :rows="8"
        placeholder="Введи описание"
        allow-clear
      />
    </UFormField>

    <USeparator>
      <span class="font-bold text-secondary">Изображения</span>
    </USeparator>

    <UFormField
      label="Основное"
      tooltip="Эта картинка отображается при просмотре страницы предмета"
      name="image"
    >
      <UploadImage
        v-model="form.image"
        section="item"
        max-size="480"
      />
    </UFormField>
  </UForm>
</template>
