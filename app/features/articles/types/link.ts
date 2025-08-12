import type { NameResponse, SourceResponse } from '~/shared/types';

export interface ArticlesLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  tags: string;
  categories: string;
  tagsArticles: string[];
}
