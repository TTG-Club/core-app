export interface CharacterStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CharacterSkill {
  name: string;
  modifier: string; // 'str', 'dex', etc.
  proficient: boolean;
  value: number;
}

export interface CharacterParams {
  speed: number;
  initiative: number;
  proficiencyBonus: number;
  armorClass: number;
  hp: {
    current: number;
    max: number;
    temp: number;
  };
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  xp: {
    current: number;
    max: number;
  };
  stats: CharacterStats;
  savingThrows: {
    [key in keyof CharacterStats]: {
      proficient: boolean;
      value: number;
    };
  };
  skills: CharacterSkill[];
  params: CharacterParams;
  passiveSenses: {
    perception: number;
    insight: number;
    investigation: number;
  };
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    languages: string[];
  };
}
