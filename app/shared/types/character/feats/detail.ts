import type { SourceResponse } from '../../base';

export interface FeatDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  category: string;
  prerequisite: string;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
}
