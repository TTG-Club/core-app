import type { SourceResponse } from '~/shared/types';

export interface GlossaryDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
  tags: string;
  tagCategory: string;
}
