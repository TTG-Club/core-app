import type { SourceResponse } from '~/shared/types';

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
  backgrounds?: Array<FeatDetailBackgroundItem>;
  updatedAt: string;
}

export interface FeatDetailBackgroundItem {
  url: string;
  name: string;
}
