import type { MaybeRefOrGetter } from 'vue';

import type { ColorMode, PresetColorMode } from '~/shared/consts';
import type {
  CustomThemePalette,
  CustomThemeSettings,
} from '~infrastructure/custom-theme/model';

import { toValue } from 'vue';

import {
  CUSTOM_THEME_STORE_KEY,
  ONE_DAY_IN_SECONDS,
  THEME_STORE_KEY,
} from '#shared/consts';
import { ThemeName } from '~/shared/consts';
import {
  createCustomThemePalette,
  CUSTOM_THEME_CLASS,
  CUSTOM_THEME_DEFAULT_SETTINGS,
  parseCustomThemeSettings,
  renderCustomThemeCss,
} from '~infrastructure/custom-theme/model';

/**
 * Последняя посчитанная палитра своей темы в браузере. Тема нужна сразу
 * нескольким компонентам, а при перетаскивании ползунка настройки меняются
 * часто — палитра по одним и тем же настройкам считается один раз.
 */
let cachedPalette: { key: string; palette: CustomThemePalette } | undefined;

/**
 * Палитра своей темы с кэшем последнего результата.
 *
 * @param settings Настройки темы.
 * @returns Палитра.
 */
function getCustomThemePalette(
  settings: CustomThemeSettings,
): CustomThemePalette {
  // На сервере кэш был бы общим для всех запросов — настройки пользователя
  // в нём не держим, палитра считается заново
  if (import.meta.server) {
    return createCustomThemePalette(settings);
  }

  const key = JSON.stringify(settings);

  if (cachedPalette?.key !== key) {
    cachedPalette = { key, palette: createCustomThemePalette(settings) };
  }

  return cachedPalette.palette;
}

/**
 * Тема сайта: готовая (тёмная, светлая, svifty7) или своя, собранная из
 * настроек пользователя. Выбор и настройки хранятся в куках, поэтому сервер
 * сразу отдаёт страницу в нужных цветах.
 */
export function useTheme() {
  const {
    public: { pwa },
  } = useRuntimeConfig();

  const themeName = useCookie<ColorMode>(THEME_STORE_KEY, {
    maxAge: ONE_DAY_IN_SECONDS * 365,
    default: () => 'dark' as const,
  });

  // Значение из куки приходит извне — проверяется схемой при каждом чтении
  const customSettingsCookie = useCookie<unknown>(CUSTOM_THEME_STORE_KEY, {
    maxAge: ONE_DAY_IN_SECONDS * 365,
    default: () => CUSTOM_THEME_DEFAULT_SETTINGS,
  });

  const customSettings = computed(() =>
    parseCustomThemeSettings(customSettingsCookie.value),
  );

  const isCustom = computed(() => themeName.value === ThemeName.Custom);

  const customPalette = computed(() =>
    isCustom.value ? getCustomThemePalette(customSettings.value) : undefined,
  );

  /** Готовая тема, файл цветов которой лежит в основе: у своей — тёмная или светлая. */
  const baseName = computed<PresetColorMode>(() =>
    themeName.value === ThemeName.Custom
      ? customSettings.value.base
      : themeName.value,
  );

  /** Классы `<html>`: у своей темы — основа и класс с её переменными. */
  const htmlClass = computed(() =>
    isCustom.value
      ? `${baseName.value} ${CUSTOM_THEME_CLASS}`
      : themeName.value,
  );

  /** CSS с переменными своей темы; у готовых тем пусто. */
  const customCss = computed(() =>
    customPalette.value ? renderCustomThemeCss(customPalette.value) : '',
  );

  const themeColor = computed(
    () =>
      customPalette.value?.pageColor
      || pwa.themeColor[baseName.value]
      || pwa.themeColor.dark,
  );

  /**
   * Переключает тему.
   *
   * @param name Имя темы.
   */
  function change(name: MaybeRefOrGetter<ThemeName>) {
    const newMode = toValue(name);

    if (!Object.values(ThemeName).find((value) => value === newMode)) {
      consola.warn(`Неизвестная тема: ${newMode}.`);

      return;
    }

    themeName.value = newMode;
  }

  /**
   * Меняет часть настроек своей темы, остальные оставляет как были.
   *
   * @param patch Изменённые настройки.
   */
  function changeCustomSettings(patch: Partial<CustomThemeSettings>) {
    customSettingsCookie.value = { ...customSettings.value, ...patch };
  }

  /** Возвращает своей теме настройки по умолчанию. */
  function resetCustomSettings() {
    customSettingsCookie.value = CUSTOM_THEME_DEFAULT_SETTINGS;
  }

  return {
    name: themeName,
    baseName,
    htmlClass,
    customCss,
    customSettings,
    customPalette,
    color: themeColor,

    change,
    changeCustomSettings,
    resetCustomSettings,
  };
}
