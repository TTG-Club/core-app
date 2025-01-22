import { z } from 'zod';

export const nameSchema = z.object({
  rus: z.string(),
  eng: z.string(),
  alt: z.string().optional(),
  short: z.string().optional(),
});

export const sourceSchema = z.object({
  name: nameSchema.extend({
    short: z.string(),
  }),
  group: nameSchema.extend({
    short: z.string(),
  }),
  page: z.number().optional(),
  homebrew: z.boolean().optional(),
  thirdParty: z.boolean().optional(),
});

export const speedSchema = z.object({
  base: z.number(),
  fly: z.number().optional(),
  climb: z.number().optional(),
  swim: z.number().optional(),
});

export const tagSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const tagsSchema = z.array(z.string());
