import type { ParticipantColor } from '~initiative/model';

import type { FightState } from './types';

import { consola } from 'consola';

import { z } from '~/utils/zod';

/**
 * Цвета токенов, известные карусели.
 *
 * Список записан здесь, а не взят из раздела трекеров: тот тянет за собой лист
 * персонажа со всей его вёрсткой, а комнате нужны только названия цветов.
 * Полноту списка стережёт `Record` — новый цвет в трекере не пройдёт проверку
 * типов, пока его не назовут и тут.
 */
const KNOWN_COLORS: Record<ParticipantColor, true> = {
  neutral: true,
  primary: true,
  success: true,
  info: true,
  warning: true,
  error: true,
};

/**
 * Знает ли карусель такой цвет.
 * @param value Название цвета.
 */
function isKnownColor(value: string): value is ParticipantColor {
  return Object.hasOwn(KNOWN_COLORS, value);
}

/**
 * Цвет токена: незнакомое значение гасим до «без цвета».
 * @param value Сырое значение цвета.
 */
function toColor(value: unknown): ParticipantColor | null {
  return typeof value === 'string' && isKnownColor(value) ? value : null;
}

const colorSchema = z.unknown().nullish().transform(toColor);

const participantSchema = z.object({
  id: z.string().min(1),
  name: z.string().catch(''),
  player: z.boolean().catch(false),
  dead: z.boolean().catch(false),
  avatarUrl: z.string().nullish().catch(null),
  color: colorSchema,
});

const fightStateSchema = z.object({
  trackerId: z.string().min(1),
  title: z.string().catch(''),
  round: z.coerce.number().int().catch(1),
  active: z.boolean().catch(false),
  currentParticipantId: z.string().nullish().catch(null),
  participants: z.array(participantSchema).catch([]),
  updatedAt: z.string().nullish().catch(null),
});

/** Приводит разобранный ответ к снимку боя. */
function toFightState(input: z.infer<typeof fightStateSchema>): FightState {
  return {
    trackerId: input.trackerId,
    title: input.title,
    round: input.round,
    active: input.active,
    currentParticipantId: input.currentParticipantId ?? null,
    participants: input.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      player: participant.player,
      dead: participant.dead,
      avatarUrl: participant.avatarUrl ?? null,
      color: participant.color,
    })),
    updatedAt: input.updatedAt ?? '',
  };
}

/**
 * Разбирает снимок боя. Битый снимок не рвёт комнату — карусель просто не
 * показывается: сражение идёт у мастера, а не здесь.
 *
 * @param input Сырой ответ сервиса или кадр подписки.
 */
export function parseFightStateSafe(input: unknown): FightState | null {
  const parsed = fightStateSchema.safeParse(input);

  if (!parsed.success) {
    consola.warn('[nexus] Снимок боя не прошёл разбор:', input);

    return null;
  }

  return toFightState(parsed.data);
}
