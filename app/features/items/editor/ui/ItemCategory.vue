<script setup lang="ts">
  import type { ItemCategory } from '~items/model';

  import { ITEM_CATEGORY_OPTIONS } from '~items/model';

  const model = defineModel<ItemCategory>({ required: true });
</script>

<template>
  <USelect
    v-model="model"
    :items="ITEM_CATEGORY_OPTIONS"
    placeholder="Выбери категорию предмета"
  />
</template>
