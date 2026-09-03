import type { ChatDiceRoll, ChatEvent, ChatSpellCast } from './types';

import { consola } from 'consola';

import { z } from '~/utils/zod';

import { CHAT_EVENT_TYPES } from './chatConstants';

/**
 * Момент времени от сервиса: Jackson отдаёт `Instant` строкой, но при иной
 * настройке — числом.
 * @param value Сырое значение из ответа сервиса.
 */
function normalizeInstant(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  return '';
}

const instantSchema = z.unknown().optional().transform(normalizeInstant);

const idSchema = z.string().min(1);

const diceValueSchema = z.object({
  value: z.coerce.number().catch(0),
  valid: z.boolean().catch(true),
  critical: z.enum(['success', 'failure']).nullish().catch(null),
});

const diceGroupSchema = z.object({
  label: z.string().nullish().catch(null),
  rolls: z.array(diceValueSchema).catch([]),
});

const diceRollPayloadSchema = z.object({
  expression: z.string().catch(''),
  total: z.coerce.number().catch(0),
  groups: z.array(diceGroupSchema).catch([]),
  subject: z.string().nullish().catch(null),
  detail: z.string().nullish().catch(null),
  // Прежние броски считал сервис: у них вместо разбора список кубов.
  results: z.array(z.coerce.number()).catch([]),
  modifier: z.coerce.number().catch(0),
  label: z.string().nullish().catch(null),
});

const spellCastPayloadSchema = z.object({
  spellId: z.string().nullish().catch(null),
  name: z.string().catch(''),
  level: z.coerce.number().int().nullish().catch(null),
  target: z.string().nullish().catch(null),
});

const chatEventResponseSchema = z.object({
  id: idSchema,
  nexusId: idSchema,
  authorId: idSchema,
  clientMessageId: z.string().catch(''),
  type: z.enum(CHAT_EVENT_TYPES).catch('TEXT'),
  text: z.string().nullish().catch(null),
  payload: z.unknown().nullish(),
  createdAt: instantSchema,
});

/**
 * Достаёт бросок из общего поля `payload`: сервис кладёт туда и бросок, и
 * заклинание, различая их типом события.
 * @param payload Сырое содержимое `payload`.
 */
function toDiceRoll(payload: unknown): ChatDiceRoll | null {
  const parsed = diceRollPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return null;
  }

  return {
    expression: parsed.data.expression,
    total: parsed.data.total,
    subject: parsed.data.subject ?? null,
    groups: parsed.data.groups.map((group) => ({
      label: group.label ?? null,
      rolls: group.rolls.map((roll) => ({
        value: roll.value,
        valid: roll.valid,
        critical: roll.critical ?? null,
      })),
    })),
    detail: parsed.data.detail ?? null,
    results: parsed.data.results,
    modifier: parsed.data.modifier,
    label: parsed.data.label ?? null,
  };
}

/**
 * Достаёт применение заклинания из общего поля `payload`.
 * @param payload Сырое содержимое `payload`.
 */
function toSpellCast(payload: unknown): ChatSpellCast | null {
  const parsed = spellCastPayloadSchema.safeParse(payload);

  if (!parsed.success || !parsed.data.name) {
    return null;
  }

  return {
    spellId: parsed.data.spellId ?? null,
    name: parsed.data.name,
    level: parsed.data.level ?? null,
    target: parsed.data.target ?? null,
  };
}

/**
 * Приводит разобранный ответ к доменному событию чата.
 * @param parsed Результат разбора ответа сервиса.
 */
function toChatEvent(
  parsed: z.infer<typeof chatEventResponseSchema>,
): ChatEvent {
  return {
    id: parsed.id,
    nexusId: parsed.nexusId,
    authorId: parsed.authorId,
    clientMessageId: parsed.clientMessageId,
    type: parsed.type,
    text: parsed.text ?? null,
    diceRoll: parsed.type === 'DICE_ROLL' ? toDiceRoll(parsed.payload) : null,
    spellCast:
      parsed.type === 'SPELL_CAST' ? toSpellCast(parsed.payload) : null,
    createdAt: parsed.createdAt,
  };
}

/**
 * Разбирает одно событие чата.
 * @param input Сырой ответ сервиса.
 */
export function parseChatEvent(input: unknown): ChatEvent {
  return toChatEvent(chatEventResponseSchema.parse(input));
}

/**
 * Разбирает событие из SSE-кадра. В отличие от `parseChatEvent` не бросает:
 * битый кадр не должен рвать живую подписку, поэтому возвращается `null`, а
 * лента просто не показывает эту запись.
 * @param input Сырое значение из `data` SSE-кадра.
 */
export function parseChatEventSafe(input: unknown): ChatEvent | null {
  const parsed = chatEventResponseSchema.safeParse(input);

  if (!parsed.success) {
    consola.warn('[nexus] Событие чата не прошло разбор:', input);

    return null;
  }

  return toChatEvent(parsed.data);
}

/**
 * Разбирает историю чата, отсеивая битые события поштучно: одно испорченное
 * не должно прятать всю ленту.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseChatEvents(input: unknown): Array<ChatEvent> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const event = parseChatEventSafe(item);

    return event ? [event] : [];
  });
}
