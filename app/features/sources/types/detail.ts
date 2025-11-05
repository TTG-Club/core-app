import type { NameResponse, SourceResponse } from '~/shared/types';

export interface SourceDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  type: string;
  published: string;
  authors: string[];
  description: Array<string>;
  image: string;
  updatedAt: string;
  tags: string;
  tagCategory: string;
}
