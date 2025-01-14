import type { z } from 'zod';
import type {
  specieLinkSchema,
  specieSchema,
} from '~~/shared/zod/character/species';

export type SpecieLink = z.infer<typeof specieLinkSchema>;

export type Specie = z.infer<typeof specieSchema>;

export interface SpecieCreate {
  url: string;
  name: {
    rus: string;
    eng: string;
    alt: Array<string>;
  };
  description: string;
  image: string | undefined;
  linkImage: string | undefined;
  gallery: Array<string> | undefined;
  parent: string | undefined;
  source: {
    url: string | undefined;
    page: number | undefined;
  };
  properties: {
    sizes: Array<string> | undefined;
    type: string | undefined;
    darkVision: number;
    speed: {
      base: number;
      fly: number;
      climb: number;
      swim: number;
    };
  };
  features: Array<{
    name: {
      rus: string;
      eng: string;
    };
    description: string;
    source: {
      url: string | undefined;
      page: number | undefined;
    };
  }>;
  tags: Array<string>;
}
