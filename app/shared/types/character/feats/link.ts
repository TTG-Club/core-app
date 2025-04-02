import type { NameResponse, SourceResponse } from '../../base';

export interface FeatLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  category: string;
  source: SourceResponse;
  concentration?: boolean;
}
