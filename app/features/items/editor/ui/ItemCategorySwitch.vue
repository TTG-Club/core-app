<script setup lang="ts">
  import type { ItemCategory } from '~items/model';

  import { ITEM_CATEGORY_OPTIONS } from '~items/model';

  const model = defineModel<ItemCategory>({ required: true });
</script>

<template>
  <!--
    Рамка карточек переведена с `border-muted` темы Nuxt UI на `border-default`:
    в тёмной теме проекта первый СВЕТЛЕЕ карточки и светится белым, а базовым
    бордером оформлено всё остальное.

    Скрытый индикатор темы центрирует подписи (`wrapper: text-center`) — здесь
    они выровнены по левому краю, а описание прижато к низу карточки: подписи в
    одну и в две строки иначе разъезжаются по высоте.
  -->
  <URadioGroup
    v-model="model"
    :items="ITEM_CATEGORY_OPTIONS"
    variant="card"
    orientation="horizontal"
    indicator="hidden"
    :ui="{
      fieldset: 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6',
      item: 'items-stretch border-default has-data-[state=checked]:bg-elevated/50',
      wrapper: 'flex h-full w-full flex-col gap-1 text-left',
      description: 'mt-auto text-xs text-balance',
    }"
  >
    <template #label="{ item }">
      <span class="flex items-start gap-2">
        <UIcon
          :name="item.icon"
          class="mt-0.5 size-5 shrink-0 text-dimmed"
        />

        <span>{{ item.label }}</span>
      </span>
    </template>
  </URadioGroup>
</template>
