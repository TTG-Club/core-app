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
  abilities: string[]; // характеристики
  increase: number; // количество характеристик для увеличения
}
