export interface BeastCreate {
  url: string; // url магического предмета
  name: BeastName; // название
  source: BeastSource; // источник
  description: string; // описание маркап
  image: string | undefined;
  tags: Array<string>; // теги

  type: BeastCategory; // типы существа
  size: BeastSize; // размеры существа
  alignment: string | undefined; // мировоззрение
  ac: string; // класс доспеха
  initiative: number; // модификатор инициативы
  hit: CreateHit;
  speed: CreateSpeeds;
  abilities: CreateAbilities;
  skills: Array<CreateSkill>;
  vulnerabilities: Array<string>;
  resistance: Array<string>;
  immunityToDamage: Array<string>;
  immunityToCondition: Array<string>;
  equipments: Array<Equipment>;
  languages: {
    languages: Array<CreateLanguage>;
    text: string | undefined;
    telepathy: string | undefined;
  };
  traits: Array<CreateTrait>;
  actions: Array<CreateAction>;
  bonusActions: Array<CreateAction>;
  reactions: Array<CreateAction>;
  legendaryActions: Array<CreateAction>;
}

export interface BeastName {
  rus: string; // русское название
  eng: string; // английское название
  alt: Array<string>; // альтернативные названия
}

export interface BeastSource {
  url: string | undefined; // урл книги
  page: number | undefined; // номер страницы; если указана книга
}

export interface BeastCategory {
  type: Array<string>;
  text: string | undefined;
}

export interface BeastSize {
  size: Array<string> | undefined;
  text: string | undefined;
  sizeString: string | undefined;
}

export interface CreateHit {
  hit: number; // среднее количество хитов или абсолютное значение
  formula: string;
  countHitDice: number | undefined; // количество костей хитов
  text: string | undefined; // текстовое описание хитов
}

export interface CreateSpeeds {
  walk: CreateSpeed;
  burrow: CreateSpeed;
  fly: CreateFlySpeed;
  swim: CreateSpeed;
  climb: CreateSpeed;
  text: string | undefined;
}

export interface CreateSpeed {
  value: number;
  text: string | undefined;
}

export interface CreateFlySpeed {
  value: number;
  text: string | undefined;
  hover: boolean | undefined;
}

export interface CreateAbilities {
  str: CreateAbility;
  dex: CreateAbility;
  con: CreateAbility;
  int: CreateAbility;
  wis: CreateAbility;
  chr: CreateAbility;
}

export interface CreateAbility {
  ability: string;
  value: number;
  save: boolean;
  mod: string | undefined;
}

export interface CreateSkill {
  skill: string;
  type: string;
  text: string;
}

export interface CreateLanguage {
  language: string | undefined;
  text: string | undefined;
}

export interface Equipment {
  url: string;
  name: string;
  quantity: string;
}

export interface CreateTrait {
  name: string;
  english: string;
  description: string;
}

export interface CreateAction {
  name: string;
  english: string;
  description: string;
  attackType: string;
  sawingThrows: Array<SavingThrow>;
  damageTypes: Array<string>;
  recharge: string;
  restrictionOfUse: string;
}

export interface SavingThrow {
  ability: string;
  dc: string;
}
