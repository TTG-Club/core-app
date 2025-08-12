import type { NameResponse, SourceResponse } from '~/shared/types';

export interface ArticlesDetailResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  categories: string;
  tagsArticles: string[];
  source: SourceResponse;
  sourcePage: number;
  description: Array<string>;
  updatedAt: string;
  tags: string;
}
