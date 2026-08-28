<script setup lang="ts">
  import type { CatalogPickerSection } from '~infrastructure/filter';

  import {
    CATALOG_PICKER_ITEM_TYPE_GROUP,
    CATALOG_PICKER_SECTIONS,
    CATALOG_PICKER_TITLES,
  } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор предметов каталога.
   *
   * Окно с фильтрами раздела вместо выпадающего списка: предметов больше тысячи,
   * и в списке их искали одним лишь названием — ни по виду, ни по стоимости
   * отобрать было нельзя. Значение поля прежнее: слаги плюс снимок названий
   * событием `select`, который формы пишут в JSONB.
   */
  const {
    disabled = false,
    multiple = false,
    excludeUrls = [],
    itemTypes = [],
    placeholder = '',
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    excludeUrls?: Array<string>;

    /**
     * Категории предметов, которыми сужен набор (`WEAPON`, `TOOL`); пусто —
     * весь каталог. Поле про оружие не должно предлагать амулеты и барабаны.
     */
    itemTypes?: Array<string>;

    /** Подпись пустого поля; пусто — общая. */
    placeholder?: string;
  }>();

  const model = defineModel<string | Array<string>>();

  const emit = defineEmits<{
    select: [refs: Array<{ url: string; name: string }>];
  }>();

  /** Закреплённый отбор поля: категории предметов, если они заданы. */
  const section = computed<CatalogPickerSection>(() => ({
    ...CATALOG_PICKER_SECTIONS.items,
    preset: (): Record<string, Array<string>> =>
      itemTypes.length ? { [CATALOG_PICKER_ITEM_TYPE_GROUP]: itemTypes } : {},
  }));
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="section"
    :title="CATALOG_PICKER_TITLES.items"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="placeholder || `Выбери предмет${multiple ? 'ы' : ''}`"
    @select="emit('select', $event)"
  />
</template>
