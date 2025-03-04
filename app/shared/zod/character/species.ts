import { z } from 'zod';
import {
  nameSchema,
  sourceSchema,
  speedSchema,
  tagsSchema,
} from '~/shared/zod/base';

export const specieLinkSchema = z.object({
  name: nameSchema,
  url: z.string().url(),
  image: z.string().url().optional(),
});

export const specieRelatedSchema = z.object({
  name: nameSchema,
  url: z.string(),
});

export const specieFeatureSchema = z.object({
  url: z.string(),
  name: nameSchema,
  description: z.string().optional(),
  source: sourceSchema.optional(),
  tags: tagsSchema.optional(),
});

export const speciePropertiesSchema = z.object({
  speed: speedSchema,
  sizes: z.array(z.string()),
  type: z.string(),
  darkVision: z.number(),
});

export const specieSchema = z.object({
  url: z.string(),
  image: z.string().url(),
  gallery: z.array(z.string()).optional(),
  name: nameSchema,
  description: z.string(),
  source: z.object({
    group: z.object({
      rus: z.string(),
      label: z.string(),
    }),
    name: z.object({
      rus: z.string(),
      eng: z.string(),
      label: z.string(),
    }),
  }),
  properties: speciePropertiesSchema,
  parent: specieRelatedSchema.optional(),
  subspecies: z.array(specieRelatedSchema).optional(),
  features: z.array(specieFeatureSchema),
  updatedAt: z.string().datetime({ precision: 0, offset: false }),
});
