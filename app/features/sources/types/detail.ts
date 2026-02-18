import type { NameResponse, SourceResponse } from '~/shared/types';

export interface SourceDetailResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  type: string;
  publisher: {
    name: string;
    published: string;
  };
  translation: {
    authors: string;
    translationDate: string;
  };
  description: Array<string>;
  image: string;
  updatedAt: string;
  tags: string;
  tagCategory: string;
}
