import type { CustomThemeSettings } from '~infrastructure/custom-theme/model';

import { describe, expect, it } from 'vitest';

import {
  createCustomThemePalette,
  CUSTOM_THEME_ACCENT_TARGET,
  CUSTOM_THEME_CLASS,
  CUSTOM_THEME_DEFAULT_LIGHTNESS,
  CUSTOM_THEME_DEFAULT_SETTINGS,
  CUSTOM_THEME_SCALE_STEPS,
  CUSTOM_THEME_SOLID_TEXT_TARGET,
  CUSTOM_THEME_TEXT_TARGETS,
  getApcaContrast,
  parseCustomThemeSettings,
  renderCustomThemeCss,
} from '~infrastructure/custom-theme/model';

const DEFAULT: CustomThemeSettings = CUSTOM_THEME_DEFAULT_SETTINGS;

const WARM: CustomThemeSettings = {
  base: 'dark',
  accent: '#c96442',
  backgroundLightness: 70,
  backgroundHue: 70,
  backgroundTint: 60,
};

const LIGHT: CustomThemeSettings = {
  base: 'light',
  accent: '#c96442',
  backgroundLightness: CUSTOM_THEME_DEFAULT_LIGHTNESS.light,
  backgroundHue: 70,
  backgroundTint: 30,
};

/** Допуск на округление цвета до 8 бит на канал. */
const ROUNDING = 1;

describe('createCustomThemePalette', () => {
  it.each([DEFAULT, WARM, LIGHT])(
    'даёт все шкалы цветов: $base $accent',
    (settings) => {
      const { variables } = createCustomThemePalette(settings);

      for (const scale of [
        'primary',
        'gray',
        'neutral',
        'red',
        'green',
        'blue',
        'yellow',
      ]) {
        for (const step of CUSTOM_THEME_SCALE_STEPS) {
          expect(variables[`color-${scale}-${step}`]).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    },
  );

  it.each([DEFAULT, WARM, LIGHT])(
    'уровни текста держат пороги контраста: $base $accent',
    (settings) => {
      const { variables, pageColor } = createCustomThemePalette(settings);
      const targets = CUSTOM_THEME_TEXT_TARGETS[settings.base];

      expect(
        getApcaContrast(variables['ui-text-highlighted'] ?? '', pageColor),
      ).toBeGreaterThanOrEqual(targets.highlighted - ROUNDING);

      expect(
        getApcaContrast(variables['ui-text'] ?? '', pageColor),
      ).toBeGreaterThanOrEqual(targets.text - ROUNDING);

      expect(
        getApcaContrast(variables['ui-text-muted'] ?? '', pageColor),
      ).toBeGreaterThanOrEqual(targets.muted - ROUNDING);

      expect(
        getApcaContrast(variables['ui-text-dimmed'] ?? '', pageColor),
      ).toBeGreaterThanOrEqual(targets.dimmed - ROUNDING);
    },
  );

  it('уровни текста идут по убыванию яркости — иерархия сохраняется', () => {
    const { variables, pageColor } = createCustomThemePalette(DEFAULT);

    const levels = [
      'ui-text-highlighted',
      'ui-text',
      'ui-text-toned',
      'ui-text-muted',
      'ui-text-dimmed',
    ].map((name) => getApcaContrast(variables[name] ?? '', pageColor));

    expect(levels).toEqual([...levels].sort((first, second) => second - first));
  });

  it('тусклый акцент осветляется до читаемого', () => {
    const palette = createCustomThemePalette({
      ...DEFAULT,
      accent: '#4e99a3',
    });

    expect(palette.isAccentAdjusted).toBe(true);

    expect(
      getApcaContrast(palette.accentColor, palette.pageColor),
    ).toBeGreaterThanOrEqual(CUSTOM_THEME_ACCENT_TARGET - ROUNDING);
  });

  it('тёмная надпись на кнопке акцента читается', () => {
    const palette = createCustomThemePalette({
      ...DEFAULT,
      accent: '#5a3fa0',
    });

    expect(
      getApcaContrast(palette.pageColor, palette.accentColor),
    ).toBeGreaterThanOrEqual(CUSTOM_THEME_SOLID_TEXT_TARGET - ROUNDING);
  });

  it('на светлой основе белая надпись на кнопке акцента читается', () => {
    const palette = createCustomThemePalette({ ...LIGHT, accent: '#f7c325' });

    expect(
      getApcaContrast('#ffffff', palette.accentColor),
    ).toBeGreaterThanOrEqual(CUSTOM_THEME_SOLID_TEXT_TARGET - ROUNDING);
  });

  it('яркость фона двигает страницу внутри основы', () => {
    const darkest = createCustomThemePalette({
      ...DEFAULT,
      backgroundLightness: 0,
    });

    const lightest = createCustomThemePalette({
      ...DEFAULT,
      backgroundLightness: 100,
    });

    expect(getApcaContrast('#ffffff', darkest.pageColor)).toBeGreaterThan(
      getApcaContrast('#ffffff', lightest.pageColor),
    );
  });

  it('читаемый акцент не трогается', () => {
    const palette = createCustomThemePalette({
      ...DEFAULT,
      accent: '#ffb37a',
    });

    expect(palette.isAccentAdjusted).toBe(false);
    expect(palette.accentColor).toBe('#ffb37a');
  });

  it('жёлтый акцент уводит предупреждение в оранжевый', () => {
    const yellow = createCustomThemePalette({ ...DEFAULT, accent: '#e0b84a' });
    const teal = createCustomThemePalette({ ...DEFAULT, accent: '#4e99a3' });

    expect(yellow.variables['color-yellow-400']).not.toBe(
      teal.variables['color-yellow-400'],
    );
  });

  it('без оттенка фона серые тона нейтральны', () => {
    const { pageColor } = createCustomThemePalette({
      ...DEFAULT,
      backgroundTint: 0,
    });

    const [red, green, blue] = [1, 3, 5].map((index) =>
      Number.parseInt(pageColor.slice(index, index + 2), 16),
    );

    expect(red).toBe(green);
    expect(green).toBe(blue);
  });
});

describe('renderCustomThemeCss', () => {
  it('пишет переменные под классом своей темы', () => {
    const css = renderCustomThemeCss(createCustomThemePalette(DEFAULT));

    expect(css.startsWith(`:root.${CUSTOM_THEME_CLASS} {`)).toBe(true);
    expect(css).toContain('--ui-primary: var(--ui-color-primary-400);');
  });
});

describe('parseCustomThemeSettings', () => {
  it('пропускает правильные настройки', () => {
    expect(parseCustomThemeSettings(WARM)).toEqual(WARM);
  });

  it('куке прежнего вида без основы и яркости достаются значения по умолчанию', () => {
    const { base, backgroundLightness, ...legacy } = WARM;

    expect(parseCustomThemeSettings(legacy)).toEqual({
      ...legacy,
      base: 'dark',
      backgroundLightness: CUSTOM_THEME_DEFAULT_LIGHTNESS.dark,
    });
  });

  it.each([
    undefined,
    'dark',
    { ...WARM, accent: 'red' },
    { ...WARM, backgroundTint: 150 },
    { ...WARM, backgroundHue: [250] },
    { ...WARM, base: 'svifty7' },
  ])('заменяет испорченное значение настройками по умолчанию: %j', (value) => {
    expect(parseCustomThemeSettings(value)).toEqual(
      CUSTOM_THEME_DEFAULT_SETTINGS,
    );
  });
});
