import { ONE_DAY_IN_SECONDS, THEME_STORE_KEY } from '~~/shared/consts';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import type { AliasToken } from 'ant-design-vue/es/theme/interface';
import type { MaybeRefOrGetter } from 'vue';
import { toValue } from 'vue';
import { theme } from 'ant-design-vue';
import type { ThemeName, ColorMode } from '~/shared/consts';
import { THEME_VARIANTS } from '~/shared/consts';

export interface ComputedThemeConfig extends Omit<ThemeConfig, 'token'> {
  token: Partial<AliasToken>;
}

export function useTheme() {
  const themeName = useCookie<ColorMode>(THEME_STORE_KEY, {
    maxAge: ONE_DAY_IN_SECONDS * 365,
    default: () => 'dark' as const,
  });

  const themeConfig = computed<ComputedThemeConfig>(() => {
    const token = THEME_VARIANTS[themeName.value];

    const algorithm =
      themeName.value === 'light'
        ? theme.defaultAlgorithm
        : theme.darkAlgorithm;

    return { token, algorithm };
  });

  function change(name: MaybeRefOrGetter<ThemeName>) {
    const newMode = toValue(name);

    if (!(newMode in THEME_VARIANTS)) {
      console.warn(`Неизвестная тема: ${newMode}.`);

      return;
    }

    themeName.value = newMode;
  }

  return {
    themeName,
    themeConfig,

    change,
  };
}
