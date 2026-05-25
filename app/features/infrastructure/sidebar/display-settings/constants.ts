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
] as const;

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
