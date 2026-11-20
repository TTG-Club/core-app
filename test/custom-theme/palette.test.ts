import type { CustomThemeSettings } from '~infrastructure/custom-theme/model';

import Color from 'colorjs.io';
import { constrain as normalizeHue } from 'colorjs.io/src/angles.js';
import { describe, expect, it } from 'vitest';

import {
  changeCustomThemeAccentLightness,
  changeCustomThemeBackgroundLightness,
  createCustomThemePalette,
  CUSTOM_THEME_ACCENT_PRESETS,
  CUSTOM_THEME_ACCENT_TARGET,
  CUSTOM_THEME_ANCHOR_STEP,
  CUSTOM_THEME_BACKGROUND_PRESETS,
  CUSTOM_THEME_CLASS,
  CUSTOM_THEME_DEFAULT_SETTINGS,
  CUSTOM_THEME_SCALE_STEPS,
  CUSTOM_THEME_SOLID_TEXT_TARGET,
  CUSTOM_THEME_STATUS_HUE_GAP,
  CUSTOM_THEME_TEXT_TARGETS,
  getApcaContrast,
  getCustomThemeAccentLightness,
  getCustomThemeBackgroundLightness,
  getCustomThemeBase,
  parseCustomThemeSettings,
  renderCustomThemeCss,
} from '~infrastructure/custom-theme/model';

const DEFAULT: CustomThemeSettings = CUSTOM_THEME_DEFAULT_SETTINGS;

const WARM: CustomThemeSettings = {
  background: '#2a2016',
  accent: '#c96442',
};

const LIGHT: CustomThemeSettings = {
  background: '#f8edd8',
  accent: '#c96442',
};

/** Сочный фон: должен приглушиться, но текст всё равно читается. */
const VIVID: CustomThemeSettings = {
  background: '#c0182a',
  accent: '#4e99a3',
};

/**
 * Фоны сверх готовых: готовых в панели всего три, а свой цвет можно набрать
 * любой — проверяем и чёрный, цветные тёмные и цветные светлые.
 */
const EXTRA_BACKGROUNDS = [
  { label: 'Чёрный', value: '#0b0b0b' },
  { label: 'Лес', value: '#0c1c12' },
  { label: 'Вино', value: '#250e12' },
  { label: 'Какао', value: '#24180f' },
  { label: 'Пергамент', value: '#f8edd8' },
  { label: 'Мята', value: '#e2f8ef' },
  { label: 'Белый', value: '#fcfcfc' },
] as const;

/**
 * Акценты сверх готовых: красный, оранжевый и бирюзовый ближе всего к цветам
 * состояний, их тоже надо проверять.
 */
const EXTRA_ACCENTS = [
  { label: 'Оранжевый', value: '#f19357' },
  { label: 'Бирюзовый', value: '#4e99a3' },
  { label: 'Красный', value: '#d0565f' },
] as const;

/** Допуск на округление цвета до 8 бит на канал. */
const ROUNDING = 1;

/** Допуск яркости фона после округления цвета, в делениях ползунка. */
const BRIGHTNESS_ROUNDING = 5;

/**
 * Допуск оттенка, в градусах: подрезка под охват sRGB сдвигает оттенок —
 * сильнее всего у тёмного жёлтого на светлой основе (до 6°).
 */
const HUE_TOLERANCE = 6;

/** Полный круг оттенков, в градусах. */
const FULL_TURN = 360;

/** Шкалы цветов состояний: ошибка, успех, инфо, предупреждение. */
const STATUS_SCALES = ['red', 'green', 'blue', 'yellow'] as const;

/**
 * Оттенок цвета в OKLCH.
 *
 * @param value Цвет в формате CSS.
 * @returns Оттенок в градусах.
 */
function getHue(value: string | undefined): number {
  return new Color(value ?? '').to('oklch').coords[2] ?? 0;
}

/**
 * Разница двух оттенков по кругу.
 *
 * @param first Первый оттенок.
 * @param second Второй оттенок.
 * @returns Расстояние от 0 до 180 градусов.
 */
function getHueDistance(first: number, second: number): number {
  const difference = normalizeHue(first - second);

  return Math.min(difference, FULL_TURN - difference);
}

describe('createCustomThemePalette', () => {
  it.each([DEFAULT, WARM, LIGHT, VIVID])(
    'даёт все шкалы цветов: $background $accent',
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

  it.each([
    DEFAULT,
    WARM,
    LIGHT,
    VIVID,
    ...[...CUSTOM_THEME_BACKGROUND_PRESETS, ...EXTRA_BACKGROUNDS].map(
      (preset) => ({
        background: preset.value,
        accent: DEFAULT.accent,
      }),
    ),
  ])(
    'уровни текста держат пороги контраста: $background $accent',
    (settings) => {
      const { variables, pageColor, base } = createCustomThemePalette(settings);

      const targets = CUSTOM_THEME_TEXT_TARGETS[base];

      // Порог может быть недостижим даже чистым белым или чёрным — тогда
      // текст должен дойти до предела
      const limit = getApcaContrast(
        base === 'dark' ? '#ffffff' : '#000000',
        pageColor,
      );

      for (const [name, target] of [
        ['ui-text-highlighted', targets.highlighted],
        ['ui-text', targets.text],
        ['ui-text-muted', targets.muted],
        ['ui-text-dimmed', targets.dimmed],
      ] as const) {
        expect(
          getApcaContrast(variables[name] ?? '', pageColor),
        ).toBeGreaterThanOrEqual(Math.min(target, limit) - ROUNDING);
      }
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
      background: changeCustomThemeBackgroundLightness(
        DEFAULT.background,
        'dark',
        0,
      ),
    });

    const lightest = createCustomThemePalette({
      ...DEFAULT,
      background: changeCustomThemeBackgroundLightness(
        DEFAULT.background,
        'dark',
        100,
      ),
    });

    expect(getApcaContrast('#ffffff', darkest.pageColor)).toBeGreaterThan(
      getApcaContrast('#ffffff', lightest.pageColor),
    );
  });

  it('основа следует из светлоты фона', () => {
    expect(getCustomThemeBase(DEFAULT.background)).toBe('dark');
    expect(getCustomThemeBase(LIGHT.background)).toBe('light');
    expect(createCustomThemePalette(LIGHT).base).toBe('light');
  });

  it('фон в пределах основы остаётся как выбран', () => {
    expect(createCustomThemePalette(LIGHT).pageColor).toBe(LIGHT.background);

    expect(createCustomThemePalette(DEFAULT).pageColor).toBe(
      DEFAULT.background,
    );
  });

  it('смена основы сохраняет оттенок фона', () => {
    const light = changeCustomThemeBackgroundLightness(
      WARM.background,
      'light',
      80,
    );

    expect(getCustomThemeBase(light)).toBe('light');

    // Цвет хранится с точностью до 8 бит на канал — яркость плывёт на пару
    // делений
    expect(
      Math.abs(getCustomThemeBackgroundLightness(light) - 80),
    ).toBeLessThanOrEqual(BRIGHTNESS_ROUNDING);

    const [red, , blue] = [1, 3, 5].map((index) =>
      Number.parseInt(light.slice(index, index + 2), 16),
    );

    expect(red).toBeGreaterThan(blue ?? 0);
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

  it.each([DEFAULT, LIGHT])(
    'ни один цвет состояния не совпадает с акцентом по оттенку: $background',
    (settings) => {
      for (const preset of [...CUSTOM_THEME_ACCENT_PRESETS, ...EXTRA_ACCENTS]) {
        const palette = createCustomThemePalette({
          ...settings,
          accent: preset.value,
        });

        const step = CUSTOM_THEME_ANCHOR_STEP[palette.base];
        const accentHue = getHue(palette.variables[`color-primary-${step}`]);

        for (const scale of STATUS_SCALES) {
          const statusHue = getHue(palette.variables[`color-${scale}-${step}`]);

          expect(
            getHueDistance(accentHue, statusHue),
            `${preset.label}: ${scale}`,
          ).toBeGreaterThanOrEqual(CUSTOM_THEME_STATUS_HUE_GAP - HUE_TOLERANCE);
        }
      }
    },
  );

  it('зелёный акцент уводит успех в бирюзовый, а не к предупреждению', () => {
    const green = createCustomThemePalette({ ...DEFAULT, accent: '#5fa86a' });

    const accentHue = getHue(green.variables['color-primary-400']);
    const successHue = getHue(green.variables['color-green-400']);

    expect(successHue).toBeGreaterThan(accentHue);
  });

  it('оранжевый акцент уводит предупреждение к жёлтому, а не на ошибку', () => {
    const orange = createCustomThemePalette({ ...DEFAULT, accent: '#d9822b' });

    const accentHue = getHue(orange.variables['color-primary-400']);
    const warningHue = getHue(orange.variables['color-yellow-400']);

    expect(warningHue).toBeGreaterThan(accentHue);
  });

  it('серый акцент не сдвигает цвета состояний', () => {
    const gray = createCustomThemePalette({ ...DEFAULT, accent: '#8a8a8a' });
    const teal = createCustomThemePalette({ ...DEFAULT, accent: '#4e99a3' });

    expect(gray.variables['color-red-400']).toBe(
      teal.variables['color-red-400'],
    );
  });

  it('серый фон даёт нейтральные серые тона', () => {
    const { pageColor } = createCustomThemePalette({
      ...DEFAULT,
      background: '#1a1a1a',
    });

    const [red, green, blue] = [1, 3, 5].map((index) =>
      Number.parseInt(pageColor.slice(index, index + 2), 16),
    );

    expect(red).toBe(green);
    expect(green).toBe(blue);
  });
});

describe('яркость акцента', () => {
  it.each([DEFAULT, LIGHT])(
    'на всём ползунке акцент читается: $background',
    (settings) => {
      for (const lightness of [0, 25, 50, 75, 100]) {
        const accent = changeCustomThemeAccentLightness(
          settings.background,
          settings.accent,
          lightness,
        );

        const palette = createCustomThemePalette({ ...settings, accent });

        // Ползунок не уводит за предел — подгонка не нужна
        expect(palette.isAccentAdjusted).toBe(false);

        expect(
          getApcaContrast(palette.accentColor, palette.pageColor),
        ).toBeGreaterThanOrEqual(CUSTOM_THEME_ACCENT_TARGET - ROUNDING);
      }
    },
  );

  it.each([DEFAULT, LIGHT])(
    'каждый шаг ползунка меняет цвет: $background',
    (settings) => {
      const colors = [0, 50, 100].map((lightness) =>
        changeCustomThemeAccentLightness(
          settings.background,
          settings.accent,
          lightness,
        ),
      );

      expect(new Set(colors).size).toBe(3);
    },
  );

  it('положение читается из цвета обратно', () => {
    const accent = changeCustomThemeAccentLightness(
      DEFAULT.background,
      DEFAULT.accent,
      40,
    );

    expect(
      Math.abs(getCustomThemeAccentLightness(DEFAULT.background, accent) - 40),
    ).toBeLessThanOrEqual(BRIGHTNESS_ROUNDING);
  });

  it('нечитаемый акцент стоит на нижнем пределе', () => {
    expect(
      getCustomThemeAccentLightness(DEFAULT.background, '#3a2a10'),
    ).toBeLessThanOrEqual(ROUNDING);
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

  it('переводит куку прежнего вида в цвет фона', () => {
    const legacy = {
      base: 'dark',
      accent: '#d7b06c',
      backgroundLightness: 40,
      backgroundHue: 264,
      backgroundTint: 43,
    };

    expect(parseCustomThemeSettings(legacy)).toEqual(
      CUSTOM_THEME_DEFAULT_SETTINGS,
    );
  });

  it('самой старой куке без основы и яркости достаётся тёмный фон', () => {
    const { background } = parseCustomThemeSettings({
      accent: '#c96442',
      backgroundHue: 70,
      backgroundTint: 60,
    });

    expect(getCustomThemeBase(background)).toBe('dark');
  });

  it.each([
    undefined,
    'dark',
    { ...WARM, accent: 'red' },
    { ...WARM, background: '#fff' },
    { accent: '#c96442', backgroundHue: [250], backgroundTint: 10 },
  ])('заменяет испорченное значение настройками по умолчанию: %j', (value) => {
    expect(parseCustomThemeSettings(value)).toEqual(
      CUSTOM_THEME_DEFAULT_SETTINGS,
    );
  });
});
