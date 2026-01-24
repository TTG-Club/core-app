export interface TokenatorFrame {
  id: string;
  url: string;
  name: string;
  params?: {
    scale?: number;
    x?: number;
    y?: number;
  };
  visible: boolean;
  order: number;
}

export type FrameTintType = 'solid' | 'gradient';

export interface FrameTint {
  enabled: boolean;
  type: FrameTintType;
  colors: [string, string?];
  blendMode?: string;
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
  frameScale: number;
}
