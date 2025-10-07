import type { NameResponse, SourceResponse } from '../../base';

export interface BackgroundDetailResponse {
  url: string;
  name: NameResponse;
  abilityScores: string; // характеристики
  feat: string; // черта
  skillProficiencies: string; // навыки
  toolProficiency: string; // владение инструментов
  equipment: string[]; // снаряжение
  source: SourceResponse;
  description: Array<string>;
  updatedAt: string;
}
