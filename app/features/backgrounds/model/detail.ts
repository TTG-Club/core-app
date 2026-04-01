import type { JSONContent } from '@tiptap/core';

import type { NameResponse, SourceResponse } from '~/shared/types';

export interface BackgroundDetailResponse {
  url: string;
  name: NameResponse;
  abilityScores: string; // характеристики
  feat: string; // черта
  skillProficiencies: string; // навыки
  toolProficiency: string[]; // владение инструментов
  equipment: string[]; // снаряжение
  source: SourceResponse;
  description: JSONContent;
  updatedAt: string;
}
