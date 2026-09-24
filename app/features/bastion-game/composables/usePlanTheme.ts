/** Цвета холста плана, взятые из темы сайта. */
export interface PlanTheme {
  background: number;
  grid: number;
  gridMajor: number;
  text: number;
  muted: number;
  accent: number;
  warning: number;
}

/** Запасные цвета — если тему прочитать не удалось (SSR, тесты). */
const FALLBACK_THEME: PlanTheme = {
  background: 0x0f141c,
  grid: 0x1f2835,
  gridMajor: 0x2b3545,
  text: 0xe3e8f0,
  muted: 0x9aa6b8,
  accent: 0xc8a24a,
  warning: 0xd9a441,
};

const THEME_KEYS: ReadonlyArray<keyof PlanTheme> = [
  'background',
  'grid',
  'gridMajor',
  'text',
  'muted',
  'accent',
  'warning',
];

/** CSS-переменные Nuxt UI, из которых берётся тема холста. */
const THEME_VARIABLES: Record<keyof PlanTheme, string> = {
  background: '--ui-bg',
  grid: '--ui-border',
  gridMajor: '--ui-border-accented',
  text: '--ui-text',
  muted: '--ui-text-muted',
  accent: '--ui-primary',
  warning: '--ui-warning',
};

/**
 * Переводит CSS-цвет в число для WebGL. Токены темы бывают в oklch, который
 * ни PixiJS, ни 2D-контекст не отдают как sRGB-строку, поэтому цвет рисуется
 * в пиксель холста 1×1 и читается обратно.
 *
 * @param context 2D-контекст холста 1×1.
 * @param cssColor Цвет в любом CSS-формате.
 * @returns Цвет 0xRRGGBB или undefined, если прочитать не удалось.
 */
function toHexNumber(
  context: CanvasRenderingContext2D,
  cssColor: string,
): number | undefined {
  if (!cssColor) {
    return undefined;
  }

  context.clearRect(0, 0, 1, 1);
  context.fillStyle = cssColor;
  context.fillRect(0, 0, 1, 1);

  const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(
    0,
    0,
    1,
    1,
  ).data;

  return alpha === 0 ? undefined : (red << 16) | (green << 8) | blue;
}

/**
 * Читает цвета темы для холста и перечитывает их при смене светлой и тёмной
 * темы сайта.
 *
 * @returns Текущие цвета холста.
 */
export function usePlanTheme() {
  const theme = shallowRef<PlanTheme>(FALLBACK_THEME);

  /** Перечитывает цвета из CSS-переменных корневого элемента. */
  function read(): void {
    if (import.meta.server) {
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = 1;
    canvas.height = 1;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const next: PlanTheme = { ...FALLBACK_THEME };

    for (const key of THEME_KEYS) {
      const cssColor = styles.getPropertyValue(THEME_VARIABLES[key]).trim();

      next[key] = toHexNumber(context, cssColor) ?? FALLBACK_THEME[key];
    }

    theme.value = next;
  }

  onMounted(read);

  // Тема сайта переключается классом и атрибутами <html>: как только они
  // меняются, цвета холста перечитываются.
  if (import.meta.client) {
    useMutationObserver(document.documentElement, read, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });
  }

  return { theme };
}
