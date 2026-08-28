<script setup lang="ts">
  import { CATALOG_PICKER_SECTIONS, CATALOG_PICKER_TITLES } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /** Выбор предысторий каталога окном с фильтрами раздела. */
  const { multiple = false, disabled = false } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
  }>();

  const model = defineModel<string | Array<string> | undefined>({
    default: undefined,
  });
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.backgrounds"
    :title="CATALOG_PICKER_TITLES.backgrounds"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="`Выбери предыстори${multiple ? 'и' : 'ю'}`"
  />
</template>
