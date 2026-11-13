import type { GraphicsMode } from '~/shared/consts';

import type { DisplaySettingsOption } from './choice';

import { LayoutWidthName, ThemeName } from '~/shared/consts';

export const THEME_OPTIONS = [
  {
    value: ThemeName.Light,
    label: 'Светлая',
    icon: 'tabler:sun',
  },
  {
    value: ThemeName.Dark,
    label: 'Темная',
    icon: 'tabler:moon',
  },
  {
    value: ThemeName.svifty7,
    label: 'svifty7',
    icon: 'tabler:palette',
  },
  {
    value: ThemeName.Custom,
    label: 'Своя',
    icon: 'tabler:color-swatch',
  },
] as const;

export const GRAPHICS_OPTIONS = [
  { value: 'beauty', label: 'Красота', icon: 'tabler:sparkles' },
  { value: 'performance', label: 'Производительность', icon: 'tabler:bolt' },
] as const satisfies ReadonlyArray<DisplaySettingsOption<GraphicsMode>>;

/** Настройка режима графики. */
export const GRAPHICS_SETTING_TITLE = 'Производительность';

export const LAYOUT_WIDTH_OPTIONS = [
  {
    value: LayoutWidthName.Default,
    label: 'Обычная',
    icon: 'tabler:layout-sidebar-right-expand',
    title: 'Обычная ширина',
  },
  {
    value: LayoutWidthName.Wide,
    label: 'Широкая',
    icon: 'tabler:columns-2',
    title: 'Широкая ширина',
  },
] as const;

export const DISPLAY_SETTINGS_TITLE = 'Настройки отображения';
export const THEME_SECTION_TITLE = 'Тема';
export const LAYOUT_WIDTH_SECTION_TITLE = 'Ширина сайта';
export const DISPLAY_SETTINGS_ARIA = 'Настройки отображения';

/** Заголовок группы настроек оформления. */
export const APPEARANCE_GROUP_TITLE = 'Оформление';

/** Заголовок группы настроек разделов справочника. */
export const SECTIONS_GROUP_TITLE = 'Разделы справочника';

/** Настройка раскладки разделов. */
export const SECTION_LAYOUT_SETTING_TITLE = 'Раскладка';

/** Почему колонки рядом недоступны. */
export const SECTION_LAYOUT_UNAVAILABLE_HINT = 'колонки — на экране от 1024 px';

/**
 * Раскладки разделов: две узкие — запись поверх списка или рядом с ним в
 * колонке по центру, как на старом сайте 5e14, — и шесть широких, где
 * колонки фильтров, списка и записи стоят в разном порядке. Широкие идут
 * парами по месту фильтров — слева, сверху, справа; в паре сперва запись
 * справа от списка, потом слева. Каждая — сочетание ширины сайта, места
 * фильтров, стороны записи и узкой колонки. Значения уходят в статистику
 * онлайна — переименование обнулит её историю.
 */
export const SECTION_LAYOUT_OPTIONS = [
  {
    value: 'default',
    label: 'Узкая · запись поверх списка',
    width: LayoutWidthName.Default,
    filters: 'left',
    detail: 'right',
    centered: false,
  },
  {
    value: 'centered',
    label: 'Узкая · список и запись рядом',
    width: LayoutWidthName.Wide,
    filters: 'top',
    detail: 'right',
    centered: true,
  },
  {
    value: 'left-right',
    label: 'Фильтры · список · запись',
    width: LayoutWidthName.Wide,
    filters: 'left',
    detail: 'right',
    centered: false,
  },
  {
    value: 'left-left',
    label: 'Фильтры · запись · список',
    width: LayoutWidthName.Wide,
    filters: 'left',
    detail: 'left',
    centered: false,
  },
  {
    value: 'top-right',
    label: 'Фильтры над списком · запись',
    width: LayoutWidthName.Wide,
    filters: 'top',
    detail: 'right',
    centered: false,
  },
  {
    value: 'top-left',
    label: 'Запись · фильтры над списком',
    width: LayoutWidthName.Wide,
    filters: 'top',
    detail: 'left',
    centered: false,
  },
  {
    value: 'right-right',
    label: 'Список · запись · фильтры',
    width: LayoutWidthName.Wide,
    filters: 'right',
    detail: 'right',
    centered: false,
  },
  {
    value: 'right-left',
    label: 'Запись · список · фильтры',
    width: LayoutWidthName.Wide,
    filters: 'right',
    detail: 'left',
    centered: false,
  },
] as const;

/** Настройка вида списков разделов. */
export const LIST_VIEW_SETTING_TITLE = 'Списки';
