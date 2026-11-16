<script setup lang="ts">
  import { CATALOG_PICKER_SECTIONS, CATALOG_PICKER_TITLES } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор существ бестиария в окне с фильтрами раздела: существ сотни, и
   * отбирать их удобнее по типу, опасности и среде, а не одним названием.
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
    :section="CATALOG_PICKER_SECTIONS.creatures"
    :title="CATALOG_PICKER_TITLES.creatures"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="`Выбери существ${multiple ? '' : 'о'}`"
  />
</template>
