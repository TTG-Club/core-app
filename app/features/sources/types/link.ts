import type { NameResponse } from '~/shared/types';

export interface SourceLinkResponse {
  url: string;
  name: NameResponse;
  tags: string;
}
