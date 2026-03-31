import type { NameResponse, SourceResponse } from '~/shared/types';

export interface BackgroundLinkResponse {
  url: string;
  name: NameResponse;

  /**
   * Характеристики (например: "STRENGTH", "CHARISMA", "DEXTERITY")
   */
  abilityScores: string[];

  /**
   * URL черты предыстории (если есть), например: "musician-phb"
   */
  featUrl?: string;

  /**
   * Владения навыками (если есть), например: ["ACROBATICS", "PERFORMANCE"]
   */
  skillsProficiencies?: string[];

  source: SourceResponse;
}

export interface BackgroundSelectResponse {
  url: string;
  name: NameResponse;
  source: SourceResponse;

  /**
   * Характеристики (например: "STRENGTH", "CHARISMA", "DEXTERITY")
   */
  abilityScores: string[];
}
