import type { EditorBaseInfoState } from '~ui/editor';
import type { AbilityKey } from '~/shared/types';

export interface ClassFeatureScalingCreate {
  level: number;
  name: string;
  description: string;
  additional: string;
}

export interface ClassFeatureCreate {
  level: number;
  name: string;
  description: string;
  additional: string;
  scaling: Array<ClassFeatureScalingCreate>;
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
  cnt: number;
  skills: Array<string>;
}

export interface ClassProficiencyCreate {
  armor: ArmorProficiencyCreate;
  weapon: WeaponProficiencyCreate;
  tool: string | undefined;
  skill: SkillProficiencyCreate;
}

export interface ClassCreate extends EditorBaseInfoState {
  gallery: Array<string>;
  description: string;
  parentUrl: string;
  hitDice: string;
  savingThrows: Array<AbilityKey>;
  proficiency: ClassProficiencyCreate;
  equipment: string;
  features: Array<ClassFeatureCreate>;
  table: Array<ClassColumnCreate>;
  casterType: string;
  image: string | undefined;
  primaryCharacteristic: AbilityKey | undefined;
}
