export interface TokenatorFrame {
  id: string;
  url: string;
  order: number;
}

export type FrameTintType = 'solid' | 'gradient';

export interface FrameTint {
  enabled: boolean;
  type: FrameTintType;
  colors: [string, string?];
  blendMode?: string;
}

export interface BackgroundStyle {
  opacity: number;
  blendMode: string;
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

/**
 * Состояние кисти для редактирования маски
 */
export interface BrushState {
  enabled: boolean;
  size: number;
  mode: 'add' | 'remove';
  halfMask: boolean;
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
  align: 'left' | 'center' | 'right';
  arc: number;
}
