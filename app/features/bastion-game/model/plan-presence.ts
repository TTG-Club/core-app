import { z } from 'zod';

import {
  PLAN_PRESENCE_COLORS,
  PLAN_PRESENCE_FIELDS,
  PLAN_PRESENCE_HASH_MULTIPLIER,
} from './plan-constants';

/**
 * Присутствие в совместном редакторе плана: кто открыл план и где его
 * указатель. Состояния приходят от других людей, поэтому читаются через Zod.
 */

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
  [PLAN_PRESENCE_FIELDS.user]: planPresenceUserSchema,
  [PLAN_PRESENCE_FIELDS.pointer]: planPresencePointerSchema
    .nullable()
    .optional(),
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
    hash =
      (hash * PLAN_PRESENCE_HASH_MULTIPLIER + (char.codePointAt(0) ?? 0)) >>> 0;
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
