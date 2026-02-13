import type { AbilityKey, NameResponse, SourceResponse } from '~/shared/types';

export interface FeatLinkResponse {
  url: string;
  name: NameResponse;
  category: string;
  source: SourceResponse;
}

export interface FeatSelectResponse extends FeatLinkResponse {
  prerequisite: string;
  repeatability: boolean;
  abilities: AbilityKey[]; // характеристики
  increase: number; // количество характеристик для увеличения
}
