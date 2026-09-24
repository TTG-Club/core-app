import { z } from 'zod';

const ORDER_CODES = [
  'CRAFT',
  'EMPOWER',
  'HARVEST',
  'MAINTAIN',
  'RECRUIT',
  'RESEARCH',
  'TRADE',
] as const;

const SPACE_CODES = ['CRAMPED', 'ROOMY', 'VAST'] as const;

const CATEGORY_CODES = ['BASIC', 'SPECIAL'] as const;

const labelSchema = z.object({
  value: z.string(),
  name: z.string(),
});

/**
 * Схема ответа `GET /api/v2/bastions/rules`: справочники и общие числа правил
 * бастиона. Коды приказов, пространств и видов перечислены явно — появление
 * нового кода на бэкенде без правки фронта должно ломать разбор, а не
 * проскакивать в селекты неизвестным значением.
 */
export const bastionRulesSchema = z.object({
  categories: z.array(labelSchema.extend({ value: z.enum(CATEGORY_CODES) })),
  spaces: z.array(
    z.object({
      value: z.enum(SPACE_CODES),
      name: z.string(),
      squares: z.number(),
      buildCost: z.number(),
      buildDays: z.number(),
      enlargeTo: z.enum(SPACE_CODES).nullable(),
      enlargeCost: z.number().nullable(),
      enlargeDays: z.number().nullable(),
    }),
  ),
  orders: z.array(
    z.object({
      value: z.enum(ORDER_CODES),
      name: z.string(),
      english: z.string(),
      description: z.string(),
      bastionWide: z.boolean(),
    }),
  ),
  prerequisites: z.array(labelSchema),
  specialFacilities: z.array(
    z.object({
      level: z.number(),
      count: z.number(),
    }),
  ),
  startingBasicFacilities: z.array(z.enum(SPACE_CODES)),
  defensiveWall: z.object({
    height: z.number(),
    costPerSquare: z.number(),
    daysPerSquare: z.number(),
    defenderDiceReduction: z.number(),
  }),
});

export type BastionRules = z.infer<typeof bastionRulesSchema>;
