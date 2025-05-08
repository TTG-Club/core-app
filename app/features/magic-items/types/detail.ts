import type { SourceResponse } from '~/shared/types';

export interface MagicItemDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  subtitle: string;
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
}
