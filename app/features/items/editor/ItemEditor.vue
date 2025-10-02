<script setup lang="ts">
  import { ItemType, CoinsType } from './ui';

  import { EditorBaseInfo, EditorFormControls } from '~ui/editor';
  import { UploadImage } from '~ui/upload';

  import type { ItemCreate } from '~items/types';
  import { ItemPreview } from '~items/preview';

  function getInitialState(): ItemCreate {
    return {
      url: '',
      name: {
        rus: '',
        eng: '',
        alt: [],
      },
      source: {
        url: undefined,
        page: undefined,
      },
      description: '',
      category: 'ITEM',
      types: [],
      cost: undefined,
      coin: undefined,
      weight: undefined,
      image: undefined,
      tags: [],
    };
  }

  const { state, onError, onSubmit } = useWorkshopForm<ItemCreate>({
    actionUrl: '/api/v2/item',
    getInitialState,
  });
</script>

<template>
  <UForm
    ref="formRef"
    :state
    class="grid gap-8"
    @error="onError"
    @submit="onSubmit"
  >
    <EditorBaseInfo
      v-model="state"
      section="items"
    />

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Подробности</h2>
      </template>

      <UFormField>
        <input
          v-model="state.category"
          type="hidden"
          name="category"
        />
      </UFormField>

      <UFormField
        label="Типы предмета"
        tooltip="Введите типы"
        name="types"
      >
        <ItemType
          v-model="state.types"
          multiple
        />
      </UFormField>

      <UFormField
        label="Количество монет"
        tooltip="Введите количество монет"
        name="cost"
      >
        <UInput
          v-model="state.cost"
          :precision="0"
          placeholder="Введи количество монет"
          min="0"
        />
      </UFormField>

      <UFormField
        label="Номинал монет"
        tooltip="Выберите номинал"
        name="coin"
      >
        <CoinsType v-model="state.coin" />
      </UFormField>

      <UFormField
        label="Вес"
        name="weight"
      >
        <UInput
          v-model="state.weight"
          placeholder="Введи вес"
        />
      </UFormField>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Описание</h2>
      </template>

      <UFormField
        label="Описание"
        name="description"
      >
        <UTextarea
          v-model="state.description"
          :rows="8"
          placeholder="Введи описание"
          allow-clear
        />
      </UFormField>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <h2 class="truncate text-base text-highlighted">Изображения</h2>
      </template>

      <UFormField
        label="Основное"
        tooltip="Эта картинка отображается при просмотре страницы предмета"
        name="image"
      >
        <UploadImage
          v-model="state.image"
          section="item"
          max-size="480"
        />
      </UFormField>
    </UCard>

    <EditorFormControls>
      <template #preview="{ opened, changeVisibility }">
        <ItemPreview
          :open="opened"
          :state="state"
          @update:open="changeVisibility"
        />
      </template>
    </EditorFormControls>
  </UForm>
</template>
