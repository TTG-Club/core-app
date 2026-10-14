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

const cellSchema = z.object({ x: z.number(), y: z.number() });

const circleSchema = z.object({
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
  cells: z.array(cellSchema).nullish(),
  shape: circleSchema.nullish(),
});

const edgeSchema = z.object({
  level: z.number(),
  x: z.number(),
  y: z.number(),
  side: z.enum(CELL_SIDES),
});

/** Ответ `GET /api/v2/player-bastions/{id}/plan`. */
export const planResponseSchema = z.object({
  bastionId: z.string(),
  version: z.number(),
  canEdit: z.boolean(),
  document: z.object({
    levels: z.array(z.number()).nullish(),
    rooms: z.array(roomSchema).nullish(),
    doors: z.array(edgeSchema.extend({ kind: z.enum(DOOR_KINDS) })).nullish(),
    windows: z.array(edgeSchema).nullish(),
    towerOpenings: z
      .array(
        z.object({
          roomId: z.string(),
          angle: z.number(),
          type: z.enum(OPENING_TYPES),
          kind: z.enum(DOOR_KINDS).nullish(),
        }),
      )
      .nullish(),
    stairs: z
      .array(
        z.object({
          id: z.string(),
          level: z.number(),
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
          direction: z.enum(CELL_SIDES),
          toLevel: z.number(),
          kind: z.enum(STAIR_KINDS),
        }),
      )
      .nullish(),
    columns: z
      .array(
        z.object({
          id: z.string(),
          level: z.number(),
          x: z.number(),
          y: z.number(),
        }),
      )
      .nullish(),
    defenseWalls: z.array(cellSchema).nullish(),
  }),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;
export type RoomKind = (typeof ROOM_KINDS)[number];
export type CellSide = (typeof CELL_SIDES)[number];
export type DoorKind = (typeof DOOR_KINDS)[number];
export type OpeningType = (typeof OPENING_TYPES)[number];
export type StairKind = (typeof STAIR_KINDS)[number];

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

export interface PlanDocument {
  levels: Array<number>;
  rooms: Array<PlanRoom>;
  doors: Array<PlanDoor>;
  windows: Array<PlanWindow>;
  towerOpenings: Array<PlanTowerOpening>;
  stairs: Array<PlanStair>;
  columns: Array<PlanColumn>;
  defenseWalls: Array<PlanCell>;
}

export interface PlanState {
  version: number;
  canEdit: boolean;
  document: PlanDocument;
}
