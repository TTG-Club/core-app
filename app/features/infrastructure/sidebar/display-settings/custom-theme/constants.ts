/** Заголовок блока своей темы. */
export const CUSTOM_THEME_TITLE = 'Своя тема';

export const CUSTOM_THEME_RESET_LABEL = 'Сбросить';

/** Заголовок группы настроек фона. */
export const CUSTOM_THEME_BACKGROUND_TITLE = 'Фон';

export const CUSTOM_THEME_BASE_TITLE = 'Основа';

export const CUSTOM_THEME_BASE_OPTIONS = [
  { value: 'dark', label: 'Тёмная', icon: 'tabler:moon' },
  { value: 'light', label: 'Светлая', icon: 'tabler:sun' },
] as const;

export const CUSTOM_THEME_BACKGROUND_COLOR_TITLE = 'Цвет';

export const CUSTOM_THEME_BACKGROUND_PICKER_LABEL = 'Выбрать свой цвет фона';

export const CUSTOM_THEME_LIGHTNESS_TITLE = 'Яркость';

export const CUSTOM_THEME_ACCENT_TITLE = 'Акцент';

export const CUSTOM_THEME_ACCENT_PICKER_LABEL = 'Выбрать свой цвет акцента';

/** Ползунок яркости фона, в процентах. */
export const CUSTOM_THEME_PERCENT_RANGE = { min: 0, max: 100 } as const;

/**
 * Обводка кружка готового цвета: выбранный и остальные. Кольцом, а не
 * `outline`: у кнопки свой `outline` для фокуса, и он перебивает обводку.
 * Тонкое кольцо нужно всем кружкам — иначе цвет, совпавший с фоном панели,
 * пропадает.
 */
export const CUSTOM_THEME_SWATCH_CLASS = {
  selected: 'ring-2 ring-primary',
  idle: 'ring-1 ring-accented',
} as const;

/** Кнопка выбора своего цвета: подсвечена, когда цвет не из готовых. */
export const CUSTOM_THEME_PICKER_BUTTON = {
  selected: { variant: 'soft', color: 'primary' },
  idle: { variant: 'ghost', color: 'neutral' },
} as const;

/** Где открывается палитра своего цвета — под кнопкой, от её левого края. */
export const CUSTOM_THEME_PICKER_POPOVER_CONTENT = {
  side: 'bottom',
  align: 'start',
} as const;

export const CUSTOM_THEME_BACKGROUND_HEX_LABEL = 'Код цвета фона';

export const CUSTOM_THEME_ACCENT_HEX_LABEL = 'Код цвета акцента';

/** Поле кода цвета: образец и предел длины — решётка и шесть цифр. */
export const CUSTOM_THEME_HEX_INPUT = {
  placeholder: '#A1B2C3',
  maxLength: 7,
} as const;

/** Подсказка, когда код цвета набран неверно. */
export const CUSTOM_THEME_HEX_ERROR_HINT =
  'Нужен код вида #A1B2C3 или #ABC, решётку можно не писать';

/** Вид поля кода цвета: обычное и с неверным кодом. */
export const CUSTOM_THEME_HEX_FIELD_STATE = {
  valid: { color: 'neutral', highlight: false },
  invalid: { color: 'error', highlight: true },
} as const;
