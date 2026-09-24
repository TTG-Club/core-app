import { z } from 'zod';

export const BUILDING_KINDS = [
  'TOWER',
  'KEEP',
  'WING',
  'HALL',
  'OUTBUILDING',
] as const;

export const OUTLINE_TYPES = ['CIRCLE', 'RECTANGLE', 'POLYGON'] as const;

export const CELL_SIDES = ['N', 'E', 'S', 'W'] as const;

export const DOOR_KINDS = ['DOOR', 'LOCKED', 'SECRET', 'PORTCULLIS'] as const;

export const PASSAGE_KINDS = ['CORRIDOR', 'RAMP', 'GALLERY', 'BRIDGE'] as const;

const cellSchema = z.object({ x: z.number(), y: z.number() });

const outlineSchema = z.object({
  type: z.enum(OUTLINE_TYPES),
  cx: z.number().nullish(),
  cy: z.number().nullish(),
  r: z.number().nullish(),
  x: z.number().nullish(),
  y: z.number().nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  points: z.array(z.array(z.number())).nullish(),
});

const floorSchema = z.object({
  level: z.number(),
  cells: z
    .array(z.object({ x: z.number(), y: z.number(), facilityId: z.string() }))
    .nullish(),
  doors: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        side: z.enum(CELL_SIDES),
        kind: z.enum(DOOR_KINDS),
      }),
    )
    .nullish(),
  windows: z
    .array(z.object({ x: z.number(), y: z.number(), side: z.enum(CELL_SIDES) }))
    .nullish(),
  stairs: z
    .array(z.object({ x: z.number(), y: z.number(), toLevel: z.number() }))
    .nullish(),
});

const buildingSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  kind: z.enum(BUILDING_KINDS).nullish(),
  outline: outlineSchema,
  floors: z.array(floorSchema).nullish(),
});

/** Ответ `GET /api/v2/player-bastions/{id}/plan`. */
export const planResponseSchema = z.object({
  bastionId: z.string(),
  version: z.number(),
  canEdit: z.boolean(),
  document: z.object({
    buildings: z.array(buildingSchema).nullish(),
    passages: z
      .array(
        z.object({
          kind: z.enum(PASSAGE_KINDS),
          level: z.number(),
          cells: z.array(cellSchema).nullish(),
        }),
      )
      .nullish(),
    walls: z.array(cellSchema).nullish(),
  }),
});

/** Контур в том виде, в каком его отдаёт сервер: поля всех видов, лишние — null. */
export type ResponseOutline = z.infer<typeof outlineSchema>;

export type BuildingKind = (typeof BUILDING_KINDS)[number];
export type OutlineType = (typeof OUTLINE_TYPES)[number];
export type CellSide = (typeof CELL_SIDES)[number];
export type DoorKind = (typeof DOOR_KINDS)[number];
export type PassageKind = (typeof PASSAGE_KINDS)[number];

export interface PlanCell {
  x: number;
  y: number;
}

/** Контур корпуса в клетках; значения кратны половине клетки. */
export type PlanOutline =
  | { type: 'CIRCLE'; cx: number; cy: number; r: number }
  | { type: 'RECTANGLE'; x: number; y: number; width: number; height: number }
  | { type: 'POLYGON'; points: Array<[number, number]> };

export interface PlanFacilityCell extends PlanCell {
  facilityId: string;
}

export interface PlanDoor extends PlanCell {
  side: CellSide;
  kind: DoorKind;
}

export interface PlanWindow extends PlanCell {
  side: CellSide;
}

export interface PlanStair extends PlanCell {
  toLevel: number;
}

export interface PlanFloor {
  level: number;
  cells: Array<PlanFacilityCell>;
  doors: Array<PlanDoor>;
  windows: Array<PlanWindow>;
  stairs: Array<PlanStair>;
}

export interface PlanBuilding {
  id: string;
  name: string;
  kind: BuildingKind;
  outline: PlanOutline;
  floors: Array<PlanFloor>;
}

export interface PlanPassage {
  kind: PassageKind;
  level: number;
  cells: Array<PlanCell>;
}

export interface PlanDocument {
  buildings: Array<PlanBuilding>;
  passages: Array<PlanPassage>;
  walls: Array<PlanCell>;
}

export interface PlanState {
  version: number;
  canEdit: boolean;
  document: PlanDocument;
}
