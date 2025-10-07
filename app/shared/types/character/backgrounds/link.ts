import type { NameResponse, SourceResponse } from '../../base';

export interface BackgroundLinkResponse {
  url: string;
  name: NameResponse;
  abilityScores: string; // характеристики
  source: SourceResponse;
}
