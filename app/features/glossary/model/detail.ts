import type { JSONContent } from '@tiptap/core';

import type { NameResponse, SourceResponse } from '~/shared/types';

export interface GlossaryDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  description: JSONContent;
  updatedAt: string;
  tags: string;
  tagCategory: string;
}
