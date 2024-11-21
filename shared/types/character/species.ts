import type { z } from 'zod';
import type {
  specieSchema,
  specieLinkSchema,
} from '~~/shared/zod/character/species';

export type SpecieLink = z.infer<typeof specieLinkSchema>;

export type Specie = z.infer<typeof specieSchema>;
