import type { SourceResponse } from '../../base';

export interface FeatDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  category: string;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
}
