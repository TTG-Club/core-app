import { ONE_DAY_IN_SECONDS, THEME_STORE_KEY } from '~~/shared/consts';
import type { ColorMode, ComputedThemeConfig } from '~/shared/utils';
import { getThemeConfig } from '~/shared/utils';

export const useTheme = createSharedComposable(() => {
  const { state: themeName, store } = useColorMode<ColorMode>({
    storageKey: null,
    modes: {
      svifty7: 'svifty7',
    },
    storageRef: useCookie<ColorMode | 'auto'>(THEME_STORE_KEY, {
      maxAge: ONE_DAY_IN_SECONDS * 365,
      default: () => 'auto',
    }),
  });

  const themeConfig = computed<ComputedThemeConfig>(() =>
    getThemeConfig(themeName.value),
  );

  const metaThemeColor = computed(() => themeConfig.value.token.colorBgLayout);

  function change(name: ColorMode) {
    store.value = name;
  }

  return {
    themeName,
    themeConfig,
    metaThemeColor,

    change,
  };
});
