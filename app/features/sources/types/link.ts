import type { NameResponse, SourceResponse } from '~/shared/types';

export interface SourceLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  tags: string;
}
