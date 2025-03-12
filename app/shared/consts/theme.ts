import type { AliasToken } from 'ant-design-vue/es/theme/interface';

export type ColorMode = 'light' | 'dark' | 'svifty7';

export const enum ThemeName {
  Dark = 'dark',
  Light = 'light',
  svifty7 = 'svifty7',
}

// Базовая конфигурация токенов
export const BASE_TOKEN_CONFIG: Partial<AliasToken> = {
  wireframe: false,
  fontFamily: '"Open Sans", sans-serif',
  colorSuccess: '#67c23a',
  colorWarning: '#e6a23c',
  colorError: '#f56c6c',
  colorInfo: '#5990ff',
} as const;

// Конфигурации тем (разбиты для читаемости)
export const LIGHT_TOKEN_CONFIG: Partial<AliasToken> = {
  ...BASE_TOKEN_CONFIG,
  colorBgBase: '#fdfaf9',
  colorBgLayout: '#fdfaf9',
  colorBgElevated: '#F4F1EC',
  colorBgContainer: '#e1e0dd',
  colorText: '#1F1E1E',
  colorTextHeading: '#1F1E1E',
  colorBorder: '#00000014',
  colorBorderBg: '#00000014',
  colorBorderSecondary: '#00000014',
  colorPrimary: '#5e5446',
} as const;

export const DARK_TOKEN_CONFIG: Partial<AliasToken> = {
  ...BASE_TOKEN_CONFIG,
  colorBgBase: '#131A20',
  colorBgLayout: '#131A20',
  colorBgElevated: '#152228',
  colorBgContainer: '#24262E',
  colorText: '#BFBFBF',
  colorTextHeading: '#e5e5e5',
  colorBorder: '#ffffff14',
  colorBorderBg: '#ffffff14',
  colorBorderSecondary: '#ffffff14',
  colorPrimary: '#447cc7',
} as const;

export const SVIFTY7_TOKEN_CONFIG: Partial<AliasToken> = {
  ...BASE_TOKEN_CONFIG,
  colorBgContainer: '#252528',
  colorBgLayout: '#252528',
  colorBgElevated: '#252528',
  colorBgMask: '#25222580',
  colorBgBase: '#1F1F22',
  colorText: '#b8b6a7',
  colorTextHeading: '#C2C0B2',
  colorBorder: '#74748040',
  colorBorderBg: '#74748040',
  colorBorderSecondary: '#74748040',
  colorPrimary: '#A54D42',
  colorSuccess: '#6BA854',
  colorWarning: '#B58F4D',
  colorError: '#B85454',
  colorInfo: '#4D88B8',
} as const;

// Словарь тем
export const THEME_VARIANTS: Record<ColorMode, Partial<AliasToken>> = {
  [ThemeName.Light]: LIGHT_TOKEN_CONFIG,
  [ThemeName.Dark]: DARK_TOKEN_CONFIG,
  [ThemeName.svifty7]: SVIFTY7_TOKEN_CONFIG,
} as const;
