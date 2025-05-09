import type { NameResponse, SourceResponse } from '../../../shared/types/base';

export interface GlossaryLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  tags: string;
  tagCategory: string;
}
