import type { RenderNode } from '~ui/markup';

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
  description?: RenderNode;
  image?: string;
  updatedAt: string;
  tags?: string;
  tagCategory?: string;
}
