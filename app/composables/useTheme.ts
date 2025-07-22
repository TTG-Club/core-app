import { toValue } from 'vue';

import { ONE_DAY_IN_SECONDS, THEME_STORE_KEY } from '~~/shared/consts';
import { ThemeName } from '~/shared/consts';

import type { MaybeRefOrGetter } from 'vue';
import type { ColorMode } from '~/shared/consts';

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

    if (!Object.values(ThemeName).find((value) => value === newMode)) {
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
