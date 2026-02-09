import type { AbilityKey } from '../../abilities';
import type { NameResponse, SourceResponse } from '../../base';

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
