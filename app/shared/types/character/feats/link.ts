import type { NameResponse, SourceResponse } from '../../base';

export interface FeatLinkResponse {
  url: string;
  name: NameResponse;
  category: string;
  source: SourceResponse;
}
