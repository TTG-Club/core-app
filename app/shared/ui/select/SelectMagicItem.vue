<script setup lang="ts">
  import { CATALOG_PICKER_SECTIONS, CATALOG_PICKER_TITLES } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор магических предметов каталога.
   *
   * Отдельно от `SelectItem`: справочники у обычных и магических предметов
   * разные, а слаг у них общего вида — по одному слагу карточку не найти.
   * Значение поля прежнее: слаги плюс снимок названий событием `select`.
   */
  const {
    disabled = false,
    multiple = false,
    excludeUrls = [],
    placeholder = '',
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    excludeUrls?: Array<string>;

    /** Подпись пустого поля; пусто — общая. */
    placeholder?: string;
  }>();

  const model = defineModel<string | Array<string>>();

  const emit = defineEmits<{
    select: [refs: Array<{ url: string; name: string }>];
  }>();
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.magicItems"
    :title="CATALOG_PICKER_TITLES.magicItems"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="
      placeholder || `Выбери магический предмет${multiple ? 'ы' : ''}`
    "
    @select="emit('select', $event)"
  />
</template>
