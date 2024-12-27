import { z } from 'zod';

export const selectOptionScheme = z.object({
  label: z.string(),
  value: z.string(),
});

export const diceSelectOptionScheme = selectOptionScheme.extend({
  maxValue: z.number().safe().int(),
});

export const spellcasterSelectOptionScheme = selectOptionScheme.extend({
  levels: z.number().safe().int(),
});
