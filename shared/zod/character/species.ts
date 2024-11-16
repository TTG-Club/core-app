import { z } from 'zod';
import { nameSchema, sourceSchema } from '~~/shared/zod/base';

export const specieLinkSchema = z.object({
  name: nameSchema,
  url: z.string().url(),
});

export const specieTagsSchema = z.object({
  magic: z.string(),
  aasimar: z.string(),
  light: z.string(),
});

export const specieFeatureSchema = z.object({
  url: z.string(),
  imageUrl: z.string().url(),
  name: nameSchema,
  description: z.string().optional(),
  source: sourceSchema,
  tags: specieTagsSchema,
});

export const speciePropertiesSchema = z.object({
  size: z.string(),
  type: z.string(),
  speed: z.number(),
  fly: z.number(),
  climb: z.number(),
  swim: z.number(),
  darkVision: z.number(),
});

export const specieSchema = z.object({
  url: z.string(),
  imageUrl: z.string().url(),
  name: nameSchema,
  description: z.string().optional(),
  source: sourceSchema,
  creatureProperties: speciePropertiesSchema,
  parentUrl: z.string().optional(),
  subSpeciesUrls: z.array(z.string()),
  features: z.array(specieFeatureSchema),
  detail: z.boolean(),
});
