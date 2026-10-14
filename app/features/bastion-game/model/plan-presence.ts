import { z } from 'zod';

/**
 * Присутствие в совместном редакторе плана: кто открыл план и где его
 * указатель. Состояния приходят от других людей, поэтому читаются через Zod.
 */

/** Цвета участников: различимы на светлой и тёмной теме. */
export const PLAN_PRESENCE_COLORS = [
  0xe5484d, 0x3e63dd, 0x30a46c, 0xf76b15, 0x8e4ec6, 0x12a594, 0xd6409f,
  0xa18072,
] as const;

/** Как часто отправлять положение указателя, мс. */
export const PLAN_POINTER_THROTTLE_MS = 50;

/** Пауза после правки перед автосохранением, мс. */
export const PLAN_AUTOSAVE_DELAY_MS = 1500;

/** Сколько ждать общий документ, прежде чем рисовать без соавторов, мс. */
export const PLAN_SYNC_TIMEOUT_MS = 5000;

const planPresenceUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number().int().nonnegative(),
});

const planPresencePointerSchema = z.object({
  x: z.number(),
  y: z.number(),
  level: z.number().int(),
});

const planPresenceStateSchema = z.object({
  user: planPresenceUserSchema,
  pointer: planPresencePointerSchema.nullable().optional(),
});

export type PlanPresenceUser = z.infer<typeof planPresenceUserSchema>;

export type PlanPresencePointer = z.infer<typeof planPresencePointerSchema>;

/** Другой участник: один на пользователя, даже если план открыт в двух вкладках. */
export interface PlanParticipant extends PlanPresenceUser {
  pointer: PlanPresencePointer | undefined;
}

/**
 * Цвет участника по его идентификатору: у одного человека он одинаков во
 * всех вкладках и у всех соавторов.
 *
 * @param userId Пользователь.
 * @returns Цвет.
 */
export function getPresenceColor(userId: string): number {
  let hash = 0;

  for (const char of userId) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }

  return (
    PLAN_PRESENCE_COLORS[hash % PLAN_PRESENCE_COLORS.length]
    ?? PLAN_PRESENCE_COLORS[0]
  );
}

/**
 * Цвет для CSS.
 *
 * @param color Цвет числом.
 * @returns Цвет в виде `#rrggbb`.
 */
export function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Другие участники из состояний присутствия. Свои вкладки и битые состояния
 * пропускаются; из нескольких вкладок одного человека берётся та, где есть
 * указатель.
 *
 * @param states Состояния присутствия по клиентам Yjs.
 * @param selfClientId Свой клиент.
 * @param selfUserId Свой пользователь.
 * @returns Участники.
 */
export function readPlanParticipants(
  states: ReadonlyMap<number, unknown>,
  selfClientId: number,
  selfUserId: string | undefined,
): Array<PlanParticipant> {
  const participants = new Map<string, PlanParticipant>();

  for (const [clientId, state] of states) {
    if (clientId === selfClientId) {
      continue;
    }

    const parsed = planPresenceStateSchema.safeParse(state);

    if (!parsed.success || parsed.data.user.id === selfUserId) {
      continue;
    }

    const { user, pointer } = parsed.data;
    const existing = participants.get(user.id);

    if (!existing || (!existing.pointer && pointer)) {
      participants.set(user.id, { ...user, pointer: pointer ?? undefined });
    }
  }

  return [...participants.values()].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}
