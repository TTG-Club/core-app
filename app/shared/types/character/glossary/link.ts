import type { NameResponse, SourceResponse } from '../../base';

export interface GlossaryLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  tags: string;
  tagCategory: string;
}
