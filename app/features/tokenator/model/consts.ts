import type {
  BackgroundStyle,
  BrushState,
  FrameTint,
  TransformState,
} from './types';

/**
 * Цвета по умолчанию для редактора токенов
 */
export const DEFAULT_COLORS = {
  BACKGROUND: '#22c55e',
  TINT: '#ff0000',
  TINT_TRANSPARENT: '#ff000000',
  GRADIENT: '#0000ff',
} as const;

/**
 * Режимы наложения для тонировки рамки
 */
export const BLEND_MODES = [
  { label: 'Обычный', value: 'source-atop' },
  { label: 'Умножение', value: 'multiply' },
  { label: 'Экран', value: 'screen' },
  { label: 'Перекрытие', value: 'overlay' },
  { label: 'Затемнение', value: 'darken' },
  { label: 'Осветление', value: 'lighten' },
  { label: 'Осветление основы', value: 'color-dodge' },
  { label: 'Затемнение основы', value: 'color-burn' },
  { label: 'Жёсткий свет', value: 'hard-light' },
  { label: 'Мягкий свет', value: 'soft-light' },
  { label: 'Разница', value: 'difference' },
  { label: 'Исключение', value: 'exclusion' },
  { label: 'Цветовой тон', value: 'hue' },
  { label: 'Насыщенность', value: 'saturation' },
  { label: 'Цветность', value: 'color' },
  { label: 'Яркость', value: 'luminosity' },
];

/**
 * Режимы наложения для фонового изображения
 */
export const BACKGROUND_BLEND_MODES = [
  { label: 'Обычный', value: 'normal' },
  { label: 'Умножение', value: 'multiply' },
  { label: 'Экран', value: 'screen' },
  { label: 'Перекрытие', value: 'overlay' },
  { label: 'Затемнение', value: 'darken' },
  { label: 'Осветление', value: 'lighten' },
  { label: 'Осветление основы', value: 'color-dodge' },
  { label: 'Затемнение основы', value: 'color-burn' },
  { label: 'Жёсткий свет', value: 'hard-light' },
  { label: 'Мягкий свет', value: 'soft-light' },
  { label: 'Разница', value: 'difference' },
  { label: 'Исключение', value: 'exclusion' },
  { label: 'Цветовой тон', value: 'hue' },
  { label: 'Насыщенность', value: 'saturation' },
  { label: 'Цветность', value: 'color' },
  { label: 'Яркость', value: 'luminosity' },
];

export const PREVIEW_ASSETS = {
  BACKGROUND: '/s3/tokenator/terrane.webp',
} as const;

/**
 * Состояние трансформаций по умолчанию
 */
export const DEFAULT_TRANSFORM: TransformState = {
  scale: 1,
  rotate: 0,
  flip: { x: false, y: false },
  position: { x: 0, y: 0 },
  maskScale: 1,
  maskRotate: 0,
  maskSides: 0, // 0 = круг
  frameScale: 1,
  frameRotate: 0,
};

/**
 * Настройки кисти по умолчанию
 */
export const DEFAULT_BRUSH_CONFIG: BrushState = {
  size: 20,
  mode: 'add',
  halfMask: false,
};

/**
 * Настройки тонировки рамки по умолчанию
 */
export const DEFAULT_FRAME_TINT: FrameTint = {
  enabled: true,
  type: 'gradient',
  colors: [DEFAULT_COLORS.TINT_TRANSPARENT, DEFAULT_COLORS.TINT_TRANSPARENT],
  blendMode: 'source-atop',
};

/**
 * Настройки фонового изображения по умолчанию
 */
export const DEFAULT_BACKGROUND_STYLE: BackgroundStyle = {
  opacity: 100,
  blendMode: 'normal',
  scale: 1,
  position: { x: 0, y: 0 },
  rotate: 0,
};

/**
 * Настройки текста по умолчанию
 */
export const DEFAULT_TEXT_CONFIG = {
  fontSize: 40,
  color: '#ffffff',
  rotation: 0,
  fontWeight: 700,
  fontFamily: 'Inter',
  align: 'center' as const,
  arc: 0,
  x: 0,
  y: 0,
};

export enum TokenatorTab {
  Library = 'library',
  Settings = 'settings',
}

export enum TokenatorTool {
  Base = 'base',
  Frame = 'frame',
  Background = 'background',
  ThreeD = '3d',
  Text = 'text',
}
