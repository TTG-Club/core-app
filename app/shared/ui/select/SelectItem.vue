<script setup lang="ts">
  import { CATALOG_PICKER_SECTIONS, CATALOG_PICKER_TITLES } from './constants';
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
  } = defineProps<{
    disabled?: boolean;
    multiple?: boolean;
    excludeUrls?: Array<string>;
  }>();

  const model = defineModel<string | Array<string>>();

  const emit = defineEmits<{
    select: [refs: Array<{ url: string; name: string }>];
  }>();
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.items"
    :title="CATALOG_PICKER_TITLES.items"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="`Выбери предмет${multiple ? 'ы' : ''}`"
    @select="emit('select', $event)"
  />
</template>
