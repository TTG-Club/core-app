import type { ImageFrame, NameResponse, SourceResponse } from '~/shared/types';

export interface SourceLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  image: string;
  /** Кадр обложки; null — не настроен, картинка стоит по центру. */
  imageFrame?: ImageFrame | null;
}
