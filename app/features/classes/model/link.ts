import type { ImageFrame, NameResponse, SourceResponse } from '~/shared/types';

export interface ClassLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  image: string;
  /** Кадр обложки; null — не настроен, картинка стоит по центру. */
  imageFrame?: ImageFrame | null;
  updatedAt: string;
  hasSubclasses?: boolean;
}
