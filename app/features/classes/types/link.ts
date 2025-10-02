import type { NameResponse, SourceResponse } from '~/shared/types';

export interface ClassLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  image: string;
  updatedAt: string;
  hasSubclasses?: boolean;
}
