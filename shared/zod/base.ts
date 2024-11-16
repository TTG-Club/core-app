import { z } from 'zod';

export const nameSchema = z.object({
  rus: z.string(),
  eng: z.string(),
  alt: z.string().optional(),
});

export const sourceSchema = z.object({
  page: z.number(),
  source: z.string(),
  name: nameSchema,
});
