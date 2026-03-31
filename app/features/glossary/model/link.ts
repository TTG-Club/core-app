import type { NameResponse, SourceResponse } from '~/shared/types';

export interface GlossaryLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  tags: string;
  tagCategory: string;
}
