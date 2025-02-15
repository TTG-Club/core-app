import type { BasicColorMode } from '@vueuse/core';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import { theme } from 'ant-design-vue';
import { ONE_DAY_IN_SECONDS, THEME_STORE_KEY } from '~~/shared/consts';

export const useTheme = () => {
  const stored = useCookie<BasicColorMode>(THEME_STORE_KEY, {
    default: () => 'dark',
    maxAge: ONE_DAY_IN_SECONDS * 365,
  });

  const { state } = useColorMode({
    storageRef: stored,
  });

  const { next } = useCycleList<BasicColorMode>(['dark', 'light'], {
    initialValue: stored,
  });

  const change = () => {
    stored.value = next();
  };

  const { defaultAlgorithm, darkAlgorithm } = theme;

  // Положение цветов светлая/темная тема
  const themeConfig = computed<ThemeConfig>(() => ({
    token: {
      colorPrimary: state.value === 'light' ? '#5e5446' : '#447cc7',
      colorBgElevated: state.value === 'light' ? '#F4F1EC' : '#181921',
      colorBgContainer: state.value === 'light' ? '#e1e0dd' : '#1f202b',
      colorSuccess: '#67c23a',
      colorWarning: '#e6a23c',
      colorError: '#f56c6c',
      colorInfo: '#5990ff',
      colorBorder: state.value === 'light' ? '#00000014' : '#ffffff14',
      wireframe: false,
      fontFamily: '"Open Sans", sans-serif',
    },
    algorithm: state.value === 'light' ? defaultAlgorithm : darkAlgorithm,
  }));

  return {
    theme: state,
    themeConfig,
    change,
  };
};
