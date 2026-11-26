import type { PlanCell, PlanCircle } from './plan-schema';

/** Точка холста в клетках (дробная). */
export interface PlanPoint {
  x: number;
  y: number;
}

/** Что рисуется поверх плана, пока жест не закончен. */
export type PlanPreview =
  | { kind: 'rect'; from: PlanCell; to: PlanCell; label: string | undefined }
  | { kind: 'circle'; circle: PlanCircle; label: string }
  | { kind: 'move'; cells: Array<PlanCell>; isValid: boolean };

/** Цвета холста плана, взятые из темы сайта. */
export interface PlanTheme {
  background: number;
  grid: number;
  gridMajor: number;
  text: number;
  muted: number;
  accent: number;
  error: number;
  shade: number;
}
