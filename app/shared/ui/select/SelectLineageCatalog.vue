<script setup lang="ts">
  import {
    CATALOG_PICKER_SECTIONS,
    CATALOG_PICKER_TITLES,
    SELECT_LINEAGE_CATALOG_PLACEHOLDERS,
  } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор происхождений (подвидов) каталога окном с фильтрами раздела — тем
   * же, каким выбирают виды и черты.
   *
   * Отдельным компонентом от {@link SelectLineage}, а не заменой ему: окно
   * ищет по ручке поиска происхождений с фильтрами видов.
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

  /** Подпись пустого поля: у выбора одной записи и нескольких она разная. */
  const placeholder = computed(() =>
    multiple
      ? SELECT_LINEAGE_CATALOG_PLACEHOLDERS.multiple
      : SELECT_LINEAGE_CATALOG_PLACEHOLDERS.single,
  );
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.lineages"
    :title="CATALOG_PICKER_TITLES.lineages"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="placeholder"
  />
</template>
