import type { NameResponse, SourceResponse } from '~/shared/types';

export interface ItemLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  cost: string;
}
