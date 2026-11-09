export type ColorMode = 'light' | 'dark' | 'svifty7' | 'custom';

/** Готовые темы сайта — у каждой свой файл цветов в `assets/css/colors`. */
export type PresetColorMode = Exclude<ColorMode, 'custom'>;

export enum ThemeName {
  Dark = 'dark',
  Light = 'light',
  svifty7 = 'svifty7',
  /** Своя тема: цвета считаются из настроек пользователя */
  Custom = 'custom',
}
