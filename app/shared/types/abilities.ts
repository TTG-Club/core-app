export enum AbilityKey {
  STRENGTH = 'STRENGTH',
  DEXTERITY = 'DEXTERITY',
  CONSTITUTION = 'CONSTITUTION',
  INTELLIGENCE = 'INTELLIGENCE',
  WISDOM = 'WISDOM',
  CHARISMA = 'CHARISMA',
}

export enum AbilityShortKey {
  STRENGTH = 'str',
  DEXTERITY = 'dex',
  CONSTITUTION = 'con',
  INTELLIGENCE = 'int',
  WISDOM = 'wis',
  CHARISMA = 'chr',
}

export interface AbilityInfo {
  key: AbilityKey;
  label: string;
  shortKey: AbilityShortKey;
  shortLabel: string;
}

export type BaseAbilityScores = Record<AbilityKey, number>;

export const ABILITIES: AbilityInfo[] = [
  {
    key: AbilityKey.STRENGTH,
    label: 'Сила',
    shortKey: AbilityShortKey.STRENGTH,
    shortLabel: 'сил',
  },
  {
    key: AbilityKey.DEXTERITY,
    label: 'Ловкость',
    shortKey: AbilityShortKey.DEXTERITY,
    shortLabel: 'лов',
  },
  {
    key: AbilityKey.CONSTITUTION,
    label: 'Телосложение',
    shortKey: AbilityShortKey.CONSTITUTION,
    shortLabel: 'тел',
  },
  {
    key: AbilityKey.INTELLIGENCE,
    label: 'Интеллект',
    shortKey: AbilityShortKey.INTELLIGENCE,
    shortLabel: 'инт',
  },
  {
    key: AbilityKey.WISDOM,
    label: 'Мудрость',
    shortKey: AbilityShortKey.WISDOM,
    shortLabel: 'муд',
  },
  {
    key: AbilityKey.CHARISMA,
    label: 'Харизма',
    shortKey: AbilityShortKey.CHARISMA,
    shortLabel: 'хар',
  },
] as const;

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  [AbilityKey.STRENGTH]: 'Сила',
  [AbilityKey.DEXTERITY]: 'Ловкость',
  [AbilityKey.CONSTITUTION]: 'Телосложение',
  [AbilityKey.INTELLIGENCE]: 'Интеллект',
  [AbilityKey.WISDOM]: 'Мудрость',
  [AbilityKey.CHARISMA]: 'Харизма',
} as const;

export const ABILITY_SHORT_LABELS: Record<AbilityKey, string> = {
  [AbilityKey.STRENGTH]: 'СИЛ',
  [AbilityKey.DEXTERITY]: 'ЛОВ',
  [AbilityKey.CONSTITUTION]: 'ТЕЛ',
  [AbilityKey.INTELLIGENCE]: 'ИНТ',
  [AbilityKey.WISDOM]: 'МДР',
  [AbilityKey.CHARISMA]: 'ХАР',
} as const;

export const ABILITY_KEYS = Object.values(AbilityKey);
export function getAbilityInfo(key: AbilityKey): AbilityInfo;

export function getAbilityInfo(key: AbilityShortKey): AbilityInfo;

export function getAbilityInfo(key: AbilityKey | AbilityShortKey): AbilityInfo {
  const ability = ABILITIES.find(
    (item) => item.key === key || item.shortKey === key,
  );

  if (!ability) {
    throw new Error(`Ability not found for key: ${key}`);
  }

  return ability;
}

export function isAbilityKey(k: unknown): k is AbilityKey {
  return typeof k === 'string' && ABILITY_KEYS.some((key) => String(key) === k);
}
