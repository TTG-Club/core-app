import type { JSONContent } from '@tiptap/core';

import type { SourceResponse } from '~/shared/types';

export interface MagicItemDetailResponse {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  image: string;
  subtitle: string;
  source: SourceResponse;
  description: JSONContent;
  updatedAt: string;
}
