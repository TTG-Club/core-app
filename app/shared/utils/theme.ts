import type { BasicColorMode } from '@vueuse/core';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import type { AliasToken } from 'ant-design-vue/es/theme/interface';
import { theme } from 'ant-design-vue';

export interface ComputedThemeConfig extends Omit<ThemeConfig, 'token'> {
  token: Partial<AliasToken>;
}

export type ColorMode = BasicColorMode | 'svifty7';

const BASE_THEME_CONFIG: Partial<AliasToken> = {
  wireframe: false,
  fontFamily: '"Open Sans", sans-serif',
  colorSuccess: '#67c23a',
  colorWarning: '#e6a23c',
  colorError: '#f56c6c',
  colorInfo: '#5990ff',
};

export const THEME_VARIANTS: Record<ColorMode, Partial<AliasToken>> = {
  light: {
    ...BASE_THEME_CONFIG,
    colorBgLayout: '#fdfaf9',
    colorBgElevated: '#F4F1EC',
    colorBgContainer: '#e1e0dd',
    colorText: '#1F1E1E',
    colorTextHeading: '#1F1E1E',
    colorBorder: '#00000014',
    colorPrimary: '#5e5446',
  },
  dark: {
    ...BASE_THEME_CONFIG,
    colorBgLayout: '#131A20',
    colorBgElevated: '#152228',
    colorBgContainer: '#24262E',
    colorText: '#BFBFBF',
    colorTextHeading: '#e5e5e5',
    colorBorder: '#ffffff14',
    colorPrimary: '#447cc7',
  },
  svifty7: {
    ...BASE_THEME_CONFIG,
    colorBgLayout: '#131A20',
    colorBgElevated: '#152228',
    colorBgContainer: '#24262E',
    colorText: '#BFBFBF',
    colorTextHeading: '#e5e5e5',
    colorBorder: '#ffffff14',
    colorPrimary: '#447cc7',
  },
};

export function getTokenConfig(name: ColorMode): Partial<AliasToken> {
  return THEME_VARIANTS[name];
}

export function getThemeConfig(name: ColorMode): ComputedThemeConfig {
  const token = getTokenConfig(name);

  return {
    token,
    algorithm: name === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
  };
}
