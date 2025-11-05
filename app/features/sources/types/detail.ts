import type { NameResponse, SourceResponse } from '~/shared/types';

export interface SourceDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
  tags: string;
  tagCategory: string;
}
