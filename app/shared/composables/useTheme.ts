import { toValue } from 'vue';

import { THEME_VARIANTS } from '~/shared/consts';
import { ONE_DAY_IN_SECONDS, THEME_STORE_KEY } from '~~/shared/consts';

import type { MaybeRefOrGetter } from 'vue';
import type { ThemeName, ColorMode } from '~/shared/consts';

export function useTheme() {
  const {
    public: { pwa },
  } = useRuntimeConfig();

  const themeName = useCookie<ColorMode>(THEME_STORE_KEY, {
    maxAge: ONE_DAY_IN_SECONDS * 365,
    default: () => 'dark' as const,
  });

  const themeColor = computed(
    () => pwa.themeColor[themeName.value] || pwa.themeColor.dark,
  );

  function change(name: MaybeRefOrGetter<ThemeName>) {
    const newMode = toValue(name);

    if (!(newMode in THEME_VARIANTS)) {
      console.warn(`Неизвестная тема: ${newMode}.`);

      return;
    }

    themeName.value = newMode;
  }

  return {
    name: themeName,
    color: themeColor,

    change,
  };
}
