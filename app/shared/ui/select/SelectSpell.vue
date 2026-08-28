<script setup lang="ts">
  import { CATALOG_PICKER_SECTIONS, CATALOG_PICKER_TITLES } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор заклинаний каталога.
   *
   * Окно с фильтрами раздела вместо выпадающего списка: заклинаний под тысячу, и
   * в списке их искали одним лишь названием — ни по кругу, ни по классу отобрать
   * было нельзя.
   */
  const {
    disabled = false,
    multiple = false,
    excludeUrls = [],
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    excludeUrls?: Array<string>;
  }>();

  const model = defineModel<string | Array<string>>({ default: '' });
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.spells"
    :title="CATALOG_PICKER_TITLES.spells"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="`Выбери заклинани${multiple ? 'я' : 'е'}`"
  />
</template>
