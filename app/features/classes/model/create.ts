import type { EditorBaseInfoState } from '~ui/editor';

import type { AbilityKey } from '~/shared/types';

export type AbilityDelimiter = 'AND' | 'OR';

export interface ClassFeatureScalingCreate {
  level: number;
  name: string;
  description: string;
  additional: string;
  hideInSubclasses: boolean | undefined;
}

export interface ClassFeatureCreate {
  level: number;
  name: string;
  description: string;
  additional: string;
  hideInSubclasses: boolean | undefined;
  abilityImprovement: boolean | undefined;
  scaling: Array<ClassFeatureScalingCreate>;
  abilityBonus?: ClassFeatureAbilityBonusCreate;
}

export interface ClassFeatureAbilityBonusCreate {
  abilities: Array<AbilityKey>;
  bonus: number;
  upto: number;
}

export interface ClassColumnScalingCreate {
  level: number;
  value: string;
}

export interface ClassColumnCreate {
  name: string;
  scaling: Array<ClassColumnScalingCreate>;
}

export interface ArmorProficiencyCreate {
  category: Array<string>;
  custom: string | undefined;
}

export interface WeaponProficiencyCreate {
  category: Array<string>;
  custom: string | undefined;
}

export interface SkillProficiencyCreate {
  count: number;
  skills: Array<string>;
}

export interface ClassProficiencyCreate {
  armor: ArmorProficiencyCreate;
  weapon: WeaponProficiencyCreate;
  tool: string | undefined;
  skill: SkillProficiencyCreate;
}

export interface ClassPrimaryCharacteristicsCreate {
  values: Array<AbilityKey> | undefined;
  delimiter: AbilityDelimiter | undefined;
}

export interface ClassCreate extends EditorBaseInfoState {
  gallery: Array<string>;
  description: string | undefined;
  parentUrl: string | undefined;
  hitDice: string | undefined;
  savingThrows: Array<AbilityKey>;
  proficiency: ClassProficiencyCreate;
  equipment: string | undefined;
  features: Array<ClassFeatureCreate>;
  table: Array<ClassColumnCreate>;
  casterType: string | undefined;
  image: string | undefined;
  primaryCharacteristics: ClassPrimaryCharacteristicsCreate;
  abilityTemplate: AbilityTemplateCreate | undefined;
}

export type AbilityTemplateCreate = [
  number,
  number,
  number,
  number,
  number,
  number,
];
