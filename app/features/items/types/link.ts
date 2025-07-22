import type { NameResponse, SourceResponse } from '~/shared/types';

export interface ItemLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  cost: string;
}
