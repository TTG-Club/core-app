import type { JSONContent } from '@tiptap/core';

import type { SourceResponse } from '~/shared/types';

export interface FeatDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  category: string;
  prerequisite: JSONContent;
  source: SourceResponse;
  description: JSONContent;
  updatedAt: string;
}
