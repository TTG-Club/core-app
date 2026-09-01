<script setup lang="ts">
  import { CATALOG_PICKER_SECTIONS, CATALOG_PICKER_TITLES } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /** Выбор видов каталога окном с фильтрами раздела. */
  const { multiple = false, disabled = false } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string>>();
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.species"
    :title="CATALOG_PICKER_TITLES.species"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери вид${multiple ? 'ы' : ''}`"
  />
</template>
