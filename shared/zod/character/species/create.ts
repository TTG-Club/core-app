import { z } from 'zod';

export const specieCreateSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string(),
    eng: z.string(),
    alt: z.array(z.string()),
  }),
  description: z.string(),
  image: z.string().url(),
  linkImage: z.string().url(),
  gallery: z.union([z.array(z.string().url()), z.undefined()]),
  parent: z.union([z.string(), z.undefined()]),
  source: z.object({
    url: z.string().optional(),
    page: z.number().optional(),
  }),
  properties: z.object({
    sizes: z.array(z.string()),
    type: z.string(),
    darkVision: z.number(),
    speed: z.object({
      base: z.number(),
      fly: z.number().optional(),
      climb: z.number().optional(),
      swim: z.number().optional(),
    }),
  }),
  features: z.array(
    z.object({
      name: z.object({
        rus: z.string(),
        eng: z.string(),
      }),
      description: z.string(),
      source: z.object({
        url: z.string().optional(),
        page: z.number().optional(),
      }),
    }),
  ),
  tags: z.array(z.string()),
});
