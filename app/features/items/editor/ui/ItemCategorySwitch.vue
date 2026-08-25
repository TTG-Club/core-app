<script setup lang="ts">
  import type { ItemCategory } from '~items/model';

  import { ITEM_CATEGORY_OPTIONS } from '~items/model';

  const model = defineModel<ItemCategory>({ required: true });
</script>

<template>
  <URadioGroup
    v-model="model"
    :items="ITEM_CATEGORY_OPTIONS"
    variant="card"
    orientation="horizontal"
    indicator="hidden"
    :ui="{
      fieldset: 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6',
      item: 'w-full',
      wrapper: 'w-full',
    }"
  >
    <template #label="{ item }">
      <span class="flex items-center gap-2">
        <UIcon
          :name="item.icon"
          class="size-5 shrink-0 text-dimmed"
        />

        <span>{{ item.label }}</span>
      </span>
    </template>
  </URadioGroup>
</template>
