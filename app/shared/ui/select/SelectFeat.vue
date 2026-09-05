<script setup lang="ts">
  import type { CatalogPickerSection } from '~infrastructure/filter';

  import {
    CATALOG_PICKER_FEAT_CATEGORY_GROUP,
    CATALOG_PICKER_SECTIONS,
    CATALOG_PICKER_SOURCE_GROUP,
    CATALOG_PICKER_TITLES,
  } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор черт каталога.
   *
   * Окно с фильтрами раздела вместо выпадающего списка: черт под три сотни, и в
   * списке их искали одним лишь названием. Суженный набор поля — категории и
   * источники — уходит закреплённым отбором фильтра: те же идентификаторы, что
   * у раздела, поэтому отбирает их бэкенд, а не клиент.
   */
  const {
    disabled = false,
    multiple = false,
    categories = [],
    excludeUrls = [],
    sources = [],
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;

    /** Категории, которыми ограничен набор; пусто — все категории. */
    categories?: Array<string>;

    excludeUrls?: Array<string>;

    /** Разрешённые источники (`['PHB']`); пусто — ограничения нет. */
    sources?: Array<string>;
  }>();

  const model = defineModel<string | Array<string>>();

  /** Закреплённый отбор поля: категории и источники, если они заданы. */
  const section = computed<CatalogPickerSection>(() => ({
    ...CATALOG_PICKER_SECTIONS.feats,
    preset: (): Record<string, Array<string>> => ({
      ...(categories.length
        ? { [CATALOG_PICKER_FEAT_CATEGORY_GROUP]: categories }
        : {}),
      ...(sources.length ? { [CATALOG_PICKER_SOURCE_GROUP]: sources } : {}),
    }),
  }));
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="section"
    :title="CATALOG_PICKER_TITLES.feats"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="`Выбери черт${multiple ? 'ы' : 'у'}`"
  />
</template>
