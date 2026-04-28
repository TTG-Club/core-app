import type { Level } from '~/shared/types';
import type { RenderNode } from '~ui/markup';

import type {
  ClassFeature,
  ClassInMulticlass,
  ClassMulticlassProficiency,
  ClassProficiency,
  ClassTable,
  HitDice,
  MulticlassDetailResponse,
} from './detail';
import type { ClassLinkResponse } from './link';

import { z } from 'zod';

import { CasterType } from './detail';

function checkRenderNode(value: unknown): value is RenderNode {
  return (
    typeof value === 'string'
    || Array.isArray(value)
    || isRenderNodeObject(value)
  );
}

function isRenderNodeObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const levelSchema = z.custom<Level>((value) => {
  return (
    typeof value === 'number'
    && Number.isInteger(value)
    && value >= 1
    && value <= 20
  );
}, 'Expected level from 1 to 20');

const renderNodeSchema = z.custom<RenderNode>(
  checkRenderNode,
  'Expected render node',
);

const nameResponseSchema = z.object({
  rus: z.string(),
  eng: z.string(),
});

const sourceGroupResponseSchema = z.object({
  rus: z.string(),
  label: z.string(),
});

const sourceResponseSchema = z.object({
  name: z.object({
    rus: z.string(),
    eng: z.string(),
    label: z.string(),
  }),
  group: sourceGroupResponseSchema,
  page: z.number(),
});

const classLinkResponseSchema: z.ZodType<ClassLinkResponse> = z.object({
  url: z.string(),
  name: nameResponseSchema,
  source: sourceResponseSchema,
  image: z.string(),
  updatedAt: z.string(),
  hasSubclasses: z.boolean().optional(),
});

const hitDiceSchema: z.ZodType<HitDice> = z.object({
  label: z.string(),
  value: z.string(),
  maxValue: z.number(),
  avg: z.number(),
});

const classTableSchema: z.ZodType<ClassTable> = z.object({
  name: z.string(),
  scaling: z.array(
    z.object({
      level: levelSchema,
      value: z.string(),
    }),
  ),
});

const classFeatureSchema: z.ZodType<ClassFeature> = z.object({
  key: z.string(),
  level: levelSchema,
  name: z.string(),
  description: renderNodeSchema,
  additional: z.string(),
  isSubclass: z.boolean().optional(),
  scaling: z
    .array(
      z.object({
        level: levelSchema,
        name: z.string(),
        description: renderNodeSchema,
        additional: z.string(),
      }),
    )
    .optional(),
});

const classProficiencySchema: z.ZodType<ClassProficiency> = z.object({
  armor: z.string(),
  weapon: z.string(),
  tool: z.string(),
  skill: z.string(),
});

const classMulticlassProficiencySchema: z.ZodType<ClassMulticlassProficiency> =
  z.object({
    armor: z.string(),
    weapon: z.string(),
    toolProficiency: z.string().optional(),
    skills: z.number().optional(),
  });

const classInMulticlassSchema: z.ZodType<ClassInMulticlass> = z.object({
  class: z.string(),
  subclass: z.string().optional(),
  level: z.number(),
  hitDice: z.string().optional(),
});

const multiclassDetailResponseSchema: z.ZodType<MulticlassDetailResponse> =
  z.object({
    url: z.string(),
    name: nameResponseSchema,
    source: sourceResponseSchema,
    description: renderNodeSchema,
    image: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    casterType: z.nativeEnum(CasterType),
    updatedAt: z.string(),
    hitDice: hitDiceSchema,
    primaryCharacteristics: z.string(),
    username: z.string(),
    proficiency: classProficiencySchema,
    equipment: renderNodeSchema,
    savingThrows: z.string(),
    table: z.array(classTableSchema),
    features: z.array(classFeatureSchema),
    hasSubclasses: z.boolean().optional(),
    parent: classLinkResponseSchema.optional(),
    multiclass: z.array(classInMulticlassSchema).optional(),
    characterLevel: z.number(),
    multiclassProficiency: classMulticlassProficiencySchema.optional(),
  });

export function parseClassLinkResponseArray(
  payload: unknown,
): Array<ClassLinkResponse> {
  return z.array(classLinkResponseSchema).parse(payload);
}

export function parseMulticlassDetailResponse(
  payload: unknown,
): MulticlassDetailResponse {
  return multiclassDetailResponseSchema.parse(payload);
}
