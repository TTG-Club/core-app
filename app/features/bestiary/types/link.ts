import type { NameResponse, SourceResponse } from '~/shared/types';

export interface CreatureLinkResponse {
  url: string;
  name: Pick<NameResponse, 'rus' | 'eng'>;
  source: SourceResponse;
  challengeRailing: string; // уровень опасности
  type: string; // типы существа
}
