import { z } from 'zod';

export const PLAYER_BASTION_STATUSES = ['SETUP', 'ACTIVE', 'ARCHIVED'] as const;

export const GAME_ROLES = ['MASTER', 'PLAYER', 'NONE'] as const;

export const FACILITY_SPACES = ['CRAMPED', 'ROOMY', 'VAST'] as const;

export const FACILITY_STATUSES = ['READY', 'BUILDING'] as const;

export const BASTION_ORDERS = [
  'CRAFT',
  'EMPOWER',
  'HARVEST',
  'MAINTAIN',
  'RECRUIT',
  'RESEARCH',
  'TRADE',
] as const;

export const ORDER_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

export const LEDGER_REASONS = [
  'DEPOSIT',
  'WITHDRAWAL',
  'ORDER',
  'REFUND',
  'BUILD',
  'ENLARGE',
] as const;

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
  status: z.enum(FACILITY_STATUSES),
  readyOnTurn: z.number().nullish(),
  pendingSpace: z
    .object({
      value: z.enum(FACILITY_SPACES),
      name: z.string(),
      squares: z.number(),
    })
    .nullish(),
  pendingReadyOnTurn: z.number().nullish(),
  enlargeable: z.boolean(),
  /** Защитников в бараке; null — сооружение не барак. */
  defenders: z.number().nullish(),
  /** Сколько защитников помещается в барак: 12 во вместительном, 24 в просторном. */
  defenderCapacity: z.number().nullish(),
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
  canGiveOrders: z.boolean(),
  facilities: z.array(facilitySchema),
});

/** Бастион игроков глазами открывшего (`PlayerBastionResponse` core-api). */
export const playerBastionSchema = z.object({
  id: z.string(),
  /** Игра, в которую добавлен бастион; null — бастион вне игры. */
  gameId: z.string().nullable(),
  ownerId: z.string(),
  name: z.string(),
  status: z.enum(PLAYER_BASTION_STATUSES),
  turn: z.number(),
  treasuryGp: z.number(),
  version: z.number(),
  /** Открывший — владелец: может удалить бастион и добавить его в игру. */
  owned: z.boolean(),
  canManage: z.boolean(),
  canEdit: z.boolean(),
  /** Можно убрать бастион из игры: владелец или мастер этой игры. */
  canLeaveGame: z.boolean(),
  /** Секрет ссылки «поделиться»; приходит только владельцу, null — ссылки нет. */
  shareToken: z.string().nullish(),
  /** Сколько запросов на правку ждут ответа владельца. */
  editRequests: z.number().nullish(),
  /** Владелец разрешил открывшему править бастион по ссылке. */
  editor: z.boolean().nullish(),
  members: z.array(memberSchema),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

/** Бастионы игры одним ответом (`PlayerBastionGameResponse` core-api). */
export const playerBastionGameSchema = z.object({
  gameId: z.string(),
  title: z.string(),
  role: z.enum(GAME_ROLES),
  /** Можно добавить в игру свой бастион. */
  canAdd: z.boolean(),
  players: z.array(
    z.object({
      userId: z.string(),
      characterName: z.string().nullable().optional(),
    }),
  ),
  bastions: z.array(playerBastionSchema),
});

/** Свои бастионы и лимит (`MyPlayerBastionsResponse` core-api). */
export const myPlayerBastionsSchema = z.object({
  limit: z.number(),
  subscriberLimit: z.number(),
  bastions: z.array(playerBastionSchema),
  /** Чужие бастионы, которые владелец разрешил править по ссылке. */
  shared: z.array(playerBastionSchema).nullish(),
});

export const BASTION_SHARE_ACCESSES = [
  'ANONYMOUS',
  'NONE',
  'PENDING',
  'GRANTED',
] as const;

/** Бастион по ссылке (`SharedPlayerBastionResponse` core-api). */
export const sharedPlayerBastionSchema = z.object({
  bastion: playerBastionSchema,
  access: z.enum(BASTION_SHARE_ACCESSES),
});

export const BASTION_EDITOR_STATUSES = ['PENDING', 'APPROVED'] as const;

/** Запрос на правку или выданное право (`PlayerBastionEditorResponse` core-api). */
export const bastionEditorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(BASTION_EDITOR_STATUSES),
  createdAt: z.string().nullish(),
});

export const bastionEditorsSchema = z.array(bastionEditorSchema);

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
              /** Предмет справочника, если варианты — инструменты ремесленников. */
              url: z.string().nullish(),
              /** Что создаётся этим инструментом в мастерской. */
              crafts: z
                .array(z.object({ url: z.string(), name: z.string() }))
                .nullish(),
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
export type MyPlayerBastions = z.infer<typeof myPlayerBastionsSchema>;
export type SharedPlayerBastion = z.infer<typeof sharedPlayerBastionSchema>;
export type BastionShareAccess = (typeof BASTION_SHARE_ACCESSES)[number];
export type BastionEditor = z.infer<typeof bastionEditorSchema>;
export type PlayerBastionStatus = PlayerBastion['status'];
export type GamePlayer = PlayerBastionGame['players'][number];

/** Игрок с доступом в запросе на создание и правку. */
export interface PlayerBastionMemberRequest {
  userId: string;
  characterName: string;
  characterLevel: number;
}

/** Новый бастион: принадлежит создавшему, его персонаж сразу в составе. */
export interface CreatePlayerBastionRequest {
  name: string;
  characterName: string;
  characterLevel: number;
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

/** Журналы бастиона (`GET /player-bastions/{id}/activity`). */
export const bastionActivitySchema = z.object({
  orders: z.array(
    z.object({
      id: z.string(),
      facilityId: z.string().nullish(),
      facilityName: z.string().nullish(),
      order: z.object({ value: z.enum(BASTION_ORDERS), name: z.string() }),
      optionName: z.string().nullish(),
      costGp: z.number(),
      givenOnTurn: z.number(),
      completesOnTurn: z.number(),
      status: z.enum(ORDER_STATUSES),
      givenBy: z.string(),
      note: z.string().nullish(),
      result: z.string().nullish(),
      canCancel: z.boolean(),
    }),
  ),
  turns: z.array(
    z.object({
      number: z.number(),
      maintain: z.boolean(),
      event: z.string().nullish(),
      summary: z.array(z.string()),
      performedBy: z.string(),
      performedAt: z.string(),
    }),
  ),
  ledger: z.array(
    z.object({
      turn: z.number(),
      amountGp: z.number(),
      reason: z.enum(LEDGER_REASONS),
      note: z.string().nullish(),
      createdBy: z.string(),
      createdAt: z.string(),
    }),
  ),
});

/** Сооружение справочника целиком — для вариантов приказа. */
export const facilityDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string(), eng: z.string() }),
  orderOptions: z
    .array(
      z.object({
        order: z.enum(BASTION_ORDERS).nullish(),
        name: z.string().nullish(),
        description: z.string().nullish(),
        days: z.number().nullish(),
        cost: z.number().nullish(),
        costNote: z.string().nullish(),
        minLevel: z.number().nullish(),
      }),
    )
    .nullish(),
});

export type BastionActivity = z.infer<typeof bastionActivitySchema>;
export type BastionActivityOrder = BastionActivity['orders'][number];
export type BastionOrderCode = (typeof BASTION_ORDERS)[number];
export type FacilityOrderOptionDetail = NonNullable<
  z.infer<typeof facilityDetailSchema>['orderOptions']
>[number];
export type LedgerReason = (typeof LEDGER_REASONS)[number];
