export const INITIATIVE_TRACKER_ENDPOINTS = {
  current: '/api/v2/initiative-trackers/current',
  tracker: (trackerId: string) => `/api/v2/initiative-trackers/${trackerId}`,
  shared: (shareToken: string) =>
    `/api/v2/initiative-trackers/shared/${shareToken}`,
  sharedActive: (shareToken: string) =>
    `/api/v2/initiative-trackers/shared/${shareToken}/active`,
  settings: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/settings`,
  participants: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/participants`,
  start: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/start`,
  previousTurn: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/previous-turn`,
  nextTurn: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/next-turn`,
  previousRound: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/previous-round`,
  nextRound: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/next-round`,
  rerollRound: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/reroll-round`,
  finish: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/finish`,
  active: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/active`,
  difficulty: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/difficulty`,
  recalculateDifficulty: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/recalculate-difficulty`,
  share: (trackerId: string) =>
    `/api/v2/initiative-trackers/${trackerId}/share`,
  participantDamage: (participantId: string) =>
    `/api/v2/initiative-trackers/participants/${participantId}/damage`,
  participantHeal: (participantId: string) =>
    `/api/v2/initiative-trackers/participants/${participantId}/heal`,
  participantTemporaryHp: (participantId: string) =>
    `/api/v2/initiative-trackers/participants/${participantId}/temporary-hp`,
  participantHp: (participantId: string) =>
    `/api/v2/initiative-trackers/participants/${participantId}/hp`,
  participantState: (participantId: string) =>
    `/api/v2/initiative-trackers/participants/${participantId}/state`,
  bestiarySearch: '/api/v2/bestiary/search',
} as const;

export const INITIATIVE_TRACKER_LOCAL_STORAGE_KEY =
  'initiative-tracker:local-current';

export const TRACKER_STATUS_LABELS = {
  SETUP: 'Подготовка',
  ACTIVE: 'Бой',
  FINISHED: 'Завершен',
} as const;

export const PARTICIPANT_TYPE_LABELS = {
  PLAYER: 'Персонаж',
  CREATURE: 'Существо',
} as const;

export const RELATION_TYPE_LABELS = {
  ALLY: 'Союзник',
  ENEMY: 'Противник',
  NEUTRAL: 'Нейтральный',
} as const;

export const RELATION_TYPE_ICONS = {
  ALLY: 'tabler:shield-check',
  ENEMY: 'tabler:swords',
  NEUTRAL: 'tabler:circle-dashed',
} as const;

export const PARTICIPANT_STATE_LABELS = {
  ACTIVE: 'В строю',
  UNCONSCIOUS: 'Без сознания',
  DEAD: 'Мертв',
} as const;

export const PARTICIPANT_STATE_ICONS = {
  ACTIVE: 'tabler:heartbeat',
  UNCONSCIOUS: 'tabler:moon',
  DEAD: 'tabler:skull',
} as const;

export const ROLL_MODE_LABELS = {
  MANUAL: 'Ручной',
  NORMAL: 'Обычный',
  ADVANTAGE: 'Преимущество',
  DISADVANTAGE: 'Помеха',
} as const;

export const ROLL_MODE_OPTIONS = [
  { label: ROLL_MODE_LABELS.MANUAL, value: 'MANUAL' },
  { label: ROLL_MODE_LABELS.NORMAL, value: 'NORMAL' },
  { label: ROLL_MODE_LABELS.ADVANTAGE, value: 'ADVANTAGE' },
  { label: ROLL_MODE_LABELS.DISADVANTAGE, value: 'DISADVANTAGE' },
];

export const RELATION_TYPE_OPTIONS = [
  { label: RELATION_TYPE_LABELS.ALLY, value: 'ALLY' },
  { label: RELATION_TYPE_LABELS.ENEMY, value: 'ENEMY' },
  { label: RELATION_TYPE_LABELS.NEUTRAL, value: 'NEUTRAL' },
];

export const PARTICIPANT_STATE_OPTIONS = [
  { label: PARTICIPANT_STATE_LABELS.ACTIVE, value: 'ACTIVE' },
  { label: PARTICIPANT_STATE_LABELS.UNCONSCIOUS, value: 'UNCONSCIOUS' },
  { label: PARTICIPANT_STATE_LABELS.DEAD, value: 'DEAD' },
];

export const PLAYER_FORM_DEFAULTS = {
  type: 'PLAYER',
  relationType: 'ALLY',
  name: '',
  level: 1,
  hpMax: 10,
  hpCurrent: 10,
  hpTemporary: 0,
  initiativeBonus: 0,
  dexterityBonus: 0,
  rollMode: 'NORMAL',
  rollValue: undefined,
} as const;

export const CREATURE_FORM_DEFAULTS = {
  type: 'CREATURE',
  relationType: 'ENEMY',
  sourceCreatureId: '',
  count: 1,
  rollMode: 'NORMAL',
  rollValue: undefined,
  hpMax: undefined,
  hpCurrent: undefined,
} as const;

export const HP_CONTROL_DEFAULT_VALUE = 1;
export const CREATURE_SEARCH_MIN_LENGTH = 2;
export const CREATURE_SEARCH_PAGE_SIZE = 20;
