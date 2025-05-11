import type { NameResponse, SourceResponse } from '~/shared/types';

export interface GlossaryDetailResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
  tags: string;
  tagCategory: string;
}
