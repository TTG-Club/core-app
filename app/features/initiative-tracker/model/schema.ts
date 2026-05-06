import { z } from 'zod';

const trackerStatusSchema = z.enum(['SETUP', 'ACTIVE', 'FINISHED']);
const participantTypeSchema = z.enum(['PLAYER', 'CREATURE']);
const relationTypeSchema = z.enum(['ALLY', 'ENEMY', 'NEUTRAL']);
const participantStateSchema = z.enum(['ACTIVE', 'UNCONSCIOUS', 'DEAD']);

const rollModeSchema = z.enum([
  'MANUAL',
  'NORMAL',
  'ADVANTAGE',
  'DISADVANTAGE',
]);

export const initiativeRollResultSchema = z.object({
  value: z.number(),
  discarded: z.boolean().default(false),
});

export const initiativeParticipantSchema = z.object({
  id: z.string(),
  type: participantTypeSchema,
  relationType: relationTypeSchema,
  name: z.string(),
  level: z.number().optional(),
  sourceCreatureId: z.string().optional(),
  initiative: z.number().default(0),
  initiativeBonus: z.number().default(0),
  dexterityBonus: z.number().default(0),
  rollMode: rollModeSchema.default('NORMAL'),
  rollValue: z.number().optional(),
  rolls: z.array(initiativeRollResultSchema).default([]),
  hpMax: z.number().default(0),
  hpCurrent: z.number().default(0),
  hpTemporary: z.number().default(0),
  state: participantStateSchema.default('ACTIVE'),
});

export const encounterDifficultySchema = z.object({
  difficulty: z.string(),
  baseExperience: z.number(),
  adjustedExperience: z.number(),
  partyThresholds: z.object({
    easy: z.number(),
    medium: z.number(),
    hard: z.number(),
    deadly: z.number(),
  }),
});

export const initiativeTrackerSchema = z.object({
  id: z.string(),
  title: z.string().default('Новый бой'),
  status: trackerStatusSchema,
  currentRound: z.number().default(1),
  currentParticipantId: z.string().optional(),
  rerollEachRound: z.boolean().default(false),
  groupSameCreaturesInitiative: z.boolean().default(false),
  shareToken: z.string().optional(),
  encounterDifficulty: encounterDifficultySchema.optional(),
  participants: z.array(initiativeParticipantSchema).default([]),
});

export const activeTextSectionSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const activeCreatureBlockSchema = z.object({
  name: z.string().optional(),
  ac: z.string().optional(),
  hp: z.string().optional(),
  speed: z.string().optional(),
  abilities: z.record(z.string(), z.string()).optional(),
  savingThrows: z.string().optional(),
  skills: z.string().optional(),
  resistances: z.string().optional(),
  immunities: z.string().optional(),
  senses: z.string().optional(),
  languages: z.string().optional(),
  challengeRating: z.string().optional(),
  traits: z.array(activeTextSectionSchema).optional(),
  actions: z.array(activeTextSectionSchema).optional(),
  bonusActions: z.array(activeTextSectionSchema).optional(),
  reactions: z.array(activeTextSectionSchema).optional(),
  legendaryActions: z.array(activeTextSectionSchema).optional(),
});

export const creatureSearchLinkSchema = z
  .object({
    url: z.string(),
    name: z.object({
      rus: z.string(),
      eng: z.string(),
    }),
    source: z
      .object({
        name: z.object({
          label: z.string(),
        }),
      })
      .passthrough(),
    challengeRailing: z.string().default(''),
    type: z.string().default(''),
  })
  .transform((creature) => ({
    url: creature.url,
    name: creature.name,
    challengeRailing: creature.challengeRailing,
    creatureType: creature.type,
    sourceLabel: creature.source.name.label,
  }));

export const creatureSearchResponseSchema = z.union([
  z.array(creatureSearchLinkSchema),
  z.object({
    value: z.array(creatureSearchLinkSchema),
    Count: z.number(),
  }),
]);
