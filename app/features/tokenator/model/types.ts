export interface TokenatorFrame {
  id: string;
  url: string;
  order: number;
}

export enum FrameTintType {
  Solid = 'solid',
  Gradient = 'gradient',
}

export interface FrameTint {
  enabled: boolean;
  type: FrameTintType;
  colors: [string, string?];
  blendMode?: string;
}

export interface BackgroundStyle {
  opacity: number;
  blendMode: string;
  scale: number;
  position: Coordinates;
  rotate: number;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface TransformState {
  scale: number;
  rotate: number;
  flip: {
    x: boolean;
    y: boolean;
  };
  position: Coordinates;
  maskScale: number;
  maskRotate: number;
  maskSides: number;
  frameScale: number;
  frameRotate: number;
}

export enum BrushMode {
  Add = 'add',
  Remove = 'remove',
}

/**
 * Состояние кисти для редактирования маски
 */
export interface BrushState {
  size: number;
  mode: BrushMode;
  halfMask: boolean;
}

/**
 * Режим редактирования в токенаторе
 */
export enum TokenatorEditMode {
  None = 'none',
  Brush = 'brush',
  Background = 'background',
}

export enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
}

/**
 * Текстовый элемент на токене
 */
export interface TokenText {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
  fontWeight: number;
  fontFamily: string;
  align: TextAlign;
  arc: number;
}

/**
 * Состояние холста (zoom и pan)
 */
export interface CanvasViewport {
  zoom: number;
  pan: Coordinates;
  isPanning: boolean;
}
