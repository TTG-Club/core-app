<script setup lang="ts">
  import {
    CATALOG_PICKER_SECTIONS,
    CATALOG_PICKER_TITLES,
    SELECT_CLASS_PLACEHOLDERS,
  } from './constants';
  import SelectCatalogEntity from './SelectCatalogEntity.vue';

  /**
   * Выбор классов каталога окном с фильтрами раздела — тем же, каким выбирают
   * заклинания и черты.
   *
   * Отдельным компонентом от {@link SelectClass}, а не заменой ему: тот выбирает
   * класс полем формы, где ответ один и виден рядом с остальными полями (родитель
   * подкласса, класс в фильтре). Здесь класс — запись справочника наравне с
   * заклинанием, и списку из нескольких классов нужны те же строки со ссылкой,
   * источником и окном выбора.
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

  /** Подпись пустого поля: у выбора одного класса и нескольких она разная. */
  const placeholder = computed(() =>
    multiple
      ? SELECT_CLASS_PLACEHOLDERS.multiple
      : SELECT_CLASS_PLACEHOLDERS.single,
  );
</script>

<template>
  <SelectCatalogEntity
    v-model="model"
    :section="CATALOG_PICKER_SECTIONS.classes"
    :title="CATALOG_PICKER_TITLES.classes"
    :multiple="multiple"
    :disabled="disabled"
    :exclude-urls="excludeUrls"
    :placeholder="placeholder"
  />
</template>
