import type { NameResponse, SourceResponse } from '~/shared/types';

export interface CreatureLinkResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;
  challengeRailing: string; // уровень опасности
  type: string; // типы существа
}
