import type { NameResponse, SourceResponse } from '~/shared/types';

export interface ClassLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  image: string;
  updatedAt: string;
  hasSubclasses?: boolean;
}
