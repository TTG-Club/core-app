import type { z } from 'zod';
import type {
  selectOptionScheme,
  diceSelectOptionScheme,
  spellcasterSelectOptionScheme,
} from '#shared/zod/dictionaries';

export type SelectOption = z.infer<typeof selectOptionScheme>;

export type DiceSelectOption = z.infer<typeof diceSelectOptionScheme>;

export type SpellcasterSelectOption = z.infer<
  typeof spellcasterSelectOptionScheme
>;
