import { z } from 'zod';

export const ROOM_KINDS = ['ROOM', 'CORRIDOR', 'COURTYARD', 'TOWER'] as const;

export const CELL_SIDES = ['N', 'E', 'S', 'W'] as const;

export const DOOR_KINDS = [
  'DOOR',
  'LOCKED',
  'SECRET',
  'PORTCULLIS',
  'ARCH',
] as const;

export const OPENING_TYPES = ['DOOR', 'WINDOW'] as const;

export const STAIR_KINDS = ['STRAIGHT', 'SPIRAL'] as const;

export const FURNITURE_KINDS = [
  'TABLE',
  'CHAIR',
  'WARDROBE',
  'SOFA',
  'BED',
] as const;

export const planCellSchema = z.object({ x: z.number(), y: z.number() });

export const planCircleSchema = z.object({
  cx: z.number(),
  cy: z.number(),
  r: z.number(),
});

const roomSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  kind: z.enum(ROOM_KINDS),
  level: z.number(),
  facilityId: z.string().nullish(),
  cells: z.array(planCellSchema).nullish(),
  shape: planCircleSchema.nullish(),
});

export const planEdgeSchema = z.object({
  level: z.number(),
  x: z.number(),
  y: z.number(),
  side: z.enum(CELL_SIDES),
});

export const planDoorSchema = planEdgeSchema.extend({
  kind: z.enum(DOOR_KINDS),
});

export const planTowerOpeningSchema = z.object({
  roomId: z.string(),
  angle: z.number(),
  type: z.enum(OPENING_TYPES),
  kind: z.enum(DOOR_KINDS).nullish(),
});

export const planStairSchema = z.object({
  id: z.string(),
  level: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  direction: z.enum(CELL_SIDES),
  toLevel: z.number(),
  kind: z.enum(STAIR_KINDS),
});

export const planColumnSchema = z.object({
  id: z.string(),
  level: z.number(),
  x: z.number(),
  y: z.number(),
});

export const planFurnitureSchema = z.object({
  id: z.string(),
  level: z.number(),
  x: z.number(),
  y: z.number(),
  kind: z.enum(FURNITURE_KINDS),
  rotation: z.number(),
});

/** Ответ `GET /api/v2/player-bastions/{id}/plan`. */
export const planResponseSchema = z.object({
  bastionId: z.string(),
  version: z.number(),
  canEdit: z.boolean(),
  document: z.object({
    levels: z.array(z.number()).nullish(),
    rooms: z.array(roomSchema).nullish(),
    doors: z.array(planDoorSchema).nullish(),
    windows: z.array(planEdgeSchema).nullish(),
    towerOpenings: z.array(planTowerOpeningSchema).nullish(),
    stairs: z.array(planStairSchema).nullish(),
    columns: z.array(planColumnSchema).nullish(),
    defenseWalls: z.array(planCellSchema).nullish(),
    furniture: z.array(planFurnitureSchema).nullish(),
  }),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;
export type RoomKind = (typeof ROOM_KINDS)[number];
export type CellSide = (typeof CELL_SIDES)[number];
export type DoorKind = (typeof DOOR_KINDS)[number];
export type OpeningType = (typeof OPENING_TYPES)[number];
export type StairKind = (typeof STAIR_KINDS)[number];
export type FurnitureKind = (typeof FURNITURE_KINDS)[number];

export interface PlanCell {
  x: number;
  y: number;
}

/** Окружность башни в клетках; значения кратны половине клетки. */
export interface PlanCircle {
  cx: number;
  cy: number;
  r: number;
}

/**
 * Комната этажа: зал, коридор, открытый двор или круглая башня. Стены не
 * хранятся — их строит редактор по границам комнат.
 */
export interface PlanRoom {
  id: string;
  name: string;
  kind: RoomKind;
  level: number;
  facilityId: string | undefined;
  cells: Array<PlanCell>;
  /** Окружность башни; у остальных комнат нет. */
  shape: PlanCircle | undefined;
}

/** Ребро клетки на этаже: на нём стоят двери и окна. */
export interface PlanEdge extends PlanCell {
  level: number;
  side: CellSide;
}

export interface PlanDoor extends PlanEdge {
  kind: DoorKind;
}

export type PlanWindow = PlanEdge;

/** Дверь или окно в стене башни: угол от востока по часовой, шаг 22.5°. */
export interface PlanTowerOpening {
  roomId: string;
  angle: number;
  type: OpeningType;
  kind: DoorKind | undefined;
}

/** Лестница — прямоугольник клеток; `direction` — куда идёт подъём. */
export interface PlanStair extends PlanCell {
  id: string;
  level: number;
  width: number;
  height: number;
  direction: CellSide;
  toLevel: number;
  kind: StairKind;
}

/** Колонна в центре клетки или на пересечении линий сетки. */
export interface PlanColumn extends PlanCell {
  id: string;
  level: number;
}

/**
 * Мебель: прямоугольник клеток от угла `(x, y)`; при повороте на 90° и 270°
 * ширина и глубина меняются местами.
 */
export interface PlanFurniture extends PlanCell {
  id: string;
  level: number;
  kind: FurnitureKind;
  /** Поворот по часовой: 0, 90, 180 или 270 градусов. */
  rotation: number;
}

export interface PlanDocument {
  levels: Array<number>;
  rooms: Array<PlanRoom>;
  doors: Array<PlanDoor>;
  windows: Array<PlanWindow>;
  towerOpenings: Array<PlanTowerOpening>;
  stairs: Array<PlanStair>;
  columns: Array<PlanColumn>;
  defenseWalls: Array<PlanCell>;
  furniture: Array<PlanFurniture>;
}

export interface PlanState {
  version: number;
  canEdit: boolean;
  document: PlanDocument;
}
