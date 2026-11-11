<script setup lang="ts">
  import {
    CATALOG_PICKER_SECTIONS,
    CATALOG_PICKER_TITLES,
    SELECT_SUBCLASS_CATALOG_PLACEHOLDERS,
  } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор подклассов каталога окном с фильтрами раздела — тем же, каким
   * выбирают виды и черты.
   *
   * Отдельным компонентом от {@link SelectSubclass}: тот выбирает подкласс
   * выпадающим списком, в том числе подклассы одного класса, а здесь нужен
   * поиск по всем подклассам с фильтрами и источниками.
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
      ? SELECT_SUBCLASS_CATALOG_PLACEHOLDERS.multiple
      : SELECT_SUBCLASS_CATALOG_PLACEHOLDERS.single,
  );
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.subclasses"
    :title="CATALOG_PICKER_TITLES.subclasses"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="placeholder"
  />
</template>
