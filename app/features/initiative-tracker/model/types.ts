export type InitiativeTrackerStatus = 'SETUP' | 'ACTIVE' | 'FINISHED';
export type InitiativeParticipantType = 'PLAYER' | 'CREATURE';
export type InitiativeRelationType = 'ALLY' | 'ENEMY' | 'NEUTRAL';
export type InitiativeParticipantState = 'ACTIVE' | 'UNCONSCIOUS' | 'DEAD';
export type InitiativeRollMode =
  | 'MANUAL'
  | 'NORMAL'
  | 'ADVANTAGE'
  | 'DISADVANTAGE';

export interface InitiativeRollResult {
  value: number;
  discarded: boolean;
}

export interface InitiativeParticipant {
  id: string;
  type: InitiativeParticipantType;
  relationType: InitiativeRelationType;
  name: string;
  level?: number;
  sourceCreatureId?: string;
  initiative: number;
  initiativeBonus: number;
  dexterityBonus: number;
  rollMode: InitiativeRollMode;
  rollValue?: number;
  rolls: Array<InitiativeRollResult>;
  hpMax: number;
  hpCurrent: number;
  hpTemporary: number;
  state: InitiativeParticipantState;
}

export interface EncounterDifficultyThresholds {
  easy: number;
  medium: number;
  hard: number;
  deadly: number;
}

export interface EncounterDifficulty {
  difficulty: string;
  baseExperience: number;
  adjustedExperience: number;
  partyThresholds: EncounterDifficultyThresholds;
}

export interface InitiativeTracker {
  id: string;
  title: string;
  status: InitiativeTrackerStatus;
  currentRound: number;
  currentParticipantId?: string;
  rerollEachRound: boolean;
  groupSameCreaturesInitiative: boolean;
  shareToken?: string;
  encounterDifficulty?: EncounterDifficulty;
  participants: Array<InitiativeParticipant>;
}

export interface TrackerSettingsPayload {
  title: string;
  rerollEachRound: boolean;
  groupSameCreaturesInitiative: boolean;
}

export interface PlayerParticipantPayload {
  type: 'PLAYER';
  relationType: InitiativeRelationType;
  name: string;
  level: number;
  hpMax: number;
  hpCurrent: number;
  hpTemporary: number;
  initiativeBonus: number;
  dexterityBonus: number;
  rollMode: InitiativeRollMode;
  rollValue?: number;
}

export interface CreatureParticipantPayload {
  type: 'CREATURE';
  relationType: InitiativeRelationType;
  sourceCreatureId: string;
  count: number;
  rollMode: InitiativeRollMode;
  rollValue?: number;
  hpMax?: number;
  hpCurrent?: number;
}

export interface HpAmountPayload {
  amount: number;
}

export interface HpPatchPayload {
  hpMax: number;
  hpCurrent: number;
  hpTemporary: number;
}

export interface ParticipantStatePayload {
  state: InitiativeParticipantState;
}

export interface ActiveCreatureBlock {
  name?: string;
  ac?: string;
  hp?: string;
  speed?: string;
  abilities?: Record<string, string>;
  savingThrows?: string;
  skills?: string;
  resistances?: string;
  immunities?: string;
  senses?: string;
  languages?: string;
  challengeRating?: string;
  traits?: Array<ActiveTextSection>;
  actions?: Array<ActiveTextSection>;
  bonusActions?: Array<ActiveTextSection>;
  reactions?: Array<ActiveTextSection>;
  legendaryActions?: Array<ActiveTextSection>;
}

export interface ActiveTextSection {
  name: string;
  description: string;
}

export interface CreatureSearchItem {
  label: string;
  value: string;
  description: string;
}

export interface CreatureSearchPage {
  value: Array<CreatureSearchLink>;
  Count: number;
}

export interface CreatureSearchLink {
  url: string;
  name: {
    rus: string;
    eng: string;
  };
  challengeRailing: string;
  creatureType: string;
  sourceLabel: string;
}
