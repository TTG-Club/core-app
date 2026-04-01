import type { JSONContent } from '@tiptap/core';

import type { NameResponse, SourceResponse } from '~/shared/types';

export interface SourceDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  type?: string;
  publisher?: {
    name: string;
    date: string;
  };
  translation?: {
    authors: string;
    date: string;
  };
  description?: JSONContent;
  image?: string;
  updatedAt: string;
  tags?: string;
  tagCategory?: string;
}
