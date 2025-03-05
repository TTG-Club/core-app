import type { NameResponse } from '~/shared/types';

export interface BookLink {
  name: NameResponse;
  url: string;
  type: string;
}
