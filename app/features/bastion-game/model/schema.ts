import { z } from 'zod';

export const PLAYER_BASTION_STATUSES = ['SETUP', 'ACTIVE', 'ARCHIVED'] as const;

export const GAME_ROLES = ['MASTER', 'PLAYER', 'NONE'] as const;

export const FACILITY_SPACES = ['CRAMPED', 'ROOMY', 'VAST'] as const;

const labelSchema = z.object({
  value: z.string(),
  name: z.string(),
});

const selectedChoiceSchema = z.object({
  name: z.string(),
  options: z.array(z.string()),
});

/** Сооружение персонажа вместе с данными справочника. */
const facilitySchema = z.object({
  id: z.string(),
  facilityUrl: z.string(),
  name: z.string(),
  english: z.string().nullable().optional(),
  category: labelSchema.nullable().optional(),
  space: z.object({
    value: z.enum(FACILITY_SPACES),
    name: z.string(),
    squares: z.number(),
  }),
  level: z.number().nullable().optional(),
  hirelings: z.number().nullable().optional(),
  orders: z.array(labelSchema),
  prerequisite: labelSchema.nullable().optional(),
  prerequisiteConfirmed: z.boolean(),
  choices: z.array(selectedChoiceSchema),
});

const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  characterName: z.string(),
  characterLevel: z.number(),
  characterSheetId: z.string().nullable().optional(),
  specialFacilityLimit: z.number(),
  canEditFacilities: z.boolean(),
  basicComplete: z.boolean(),
  facilities: z.array(facilitySchema),
});

/** Бастион игроков глазами открывшего (`PlayerBastionResponse` core-api). */
export const playerBastionSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  status: z.enum(PLAYER_BASTION_STATUSES),
  turn: z.number(),
  treasuryGp: z.number(),
  version: z.number(),
  canManage: z.boolean(),
  canEdit: z.boolean(),
  members: z.array(memberSchema),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/** Бастионы игры одним ответом (`PlayerBastionGameResponse` core-api). */
export const playerBastionGameSchema = z.object({
  gameId: z.string(),
  title: z.string(),
  role: z.enum(GAME_ROLES),
  canCreate: z.boolean(),
  players: z.array(
    z.object({
      userId: z.string(),
      characterName: z.string().nullable().optional(),
    }),
  ),
  bastions: z.array(playerBastionSchema),
});

/**
 * Сооружение справочника для экрана выбора: краткий ответ
 * `GET /api/v2/bastions/search` вместе с выборами и признаком «можно несколько».
 */
export const catalogFacilitySchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string(), eng: z.string() }),
  category: labelSchema.nullable().optional(),
  level: z.number().nullable().optional(),
  prerequisite: labelSchema.nullable().optional(),
  space: z
    .object({
      value: z.enum(FACILITY_SPACES),
      name: z.string(),
      squares: z.number(),
    })
    .nullable()
    .optional(),
  orders: z.array(labelSchema).nullable().optional(),
  repeatable: z.boolean().nullable().optional(),
  choices: z
    .array(
      z.object({
        name: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        count: z.number().nullable().optional(),
        enlargedCount: z.number().nullable().optional(),
        options: z
          .array(
            z.object({
              name: z.string().nullable().optional(),
              description: z.string().nullable().optional(),
            }),
          )
          .nullable()
          .optional(),
      }),
    )
    .nullable()
    .optional(),
});

export const catalogFacilitiesSchema = z.array(catalogFacilitySchema);

export type PlayerBastion = z.infer<typeof playerBastionSchema>;
export type PlayerBastionMember = z.infer<typeof memberSchema>;
export type PlayerBastionFacility = z.infer<typeof facilitySchema>;
export type SelectedChoice = z.infer<typeof selectedChoiceSchema>;
export type CatalogFacility = z.infer<typeof catalogFacilitySchema>;
export type FacilitySpaceCode = (typeof FACILITY_SPACES)[number];
export type PlayerBastionGame = z.infer<typeof playerBastionGameSchema>;
export type PlayerBastionStatus = PlayerBastion['status'];
export type GamePlayer = PlayerBastionGame['players'][number];

/** Игрок с доступом в запросе на создание и правку. */
export interface PlayerBastionMemberRequest {
  userId: string;
  characterName: string;
  characterLevel: number;
}

export interface CreatePlayerBastionRequest {
  gameId: string;
  name: string;
  members: Array<PlayerBastionMemberRequest>;
}

/** Стартовый выбор сооружений персонажа (`FacilitySetupRequest` core-api). */
export interface FacilitySetupRequest {
  basic: Array<{ facilityUrl: string; space: FacilitySpaceCode }>;
  special: Array<{ facilityUrl: string; choices: Array<SelectedChoice> }>;
  version: number;
}

export interface UpdatePlayerBastionRequest {
  name: string;
  members: Array<PlayerBastionMemberRequest>;
  version: number;
}
