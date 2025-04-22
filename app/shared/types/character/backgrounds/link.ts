import type { NameResponse, SourceResponse } from '../../base';

export interface BackgroundLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  abilityScores: string; // характеристики
  source: SourceResponse;
}
