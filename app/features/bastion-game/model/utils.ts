import type {
  GamePlayer,
  PlayerBastion,
  PlayerBastionMemberRequest,
} from './schema';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import { BASTION_START_LEVEL } from './constants';

const SERVICE_UNAVAILABLE_STATUS = StatusCodes.SERVICE_UNAVAILABLE;

/** Строка формы доступа: игрок игры и его персонаж в бастионе. */
export interface BastionMemberDraft {
  userId: string;
  selected: boolean;
  characterName: string;
  characterLevel: number;
}

/**
 * Собирает строки формы доступа: по одной на каждого игрока игры. Игроки, у
 * которых доступ уже есть, отмечены и несут своего персонажа; остальные —
 * с именем персонажа из заявки и стартовым уровнем бастиона.
 *
 * @param players Игроки игры с одобренной заявкой.
 * @param bastion Редактируемый бастион; нет — форма создания.
 * @returns Строки формы в порядке игроков игры.
 */
export function createMemberDrafts(
  players: ReadonlyArray<GamePlayer>,
  bastion?: PlayerBastion,
): Array<BastionMemberDraft> {
  const members = new Map(
    (bastion?.members ?? []).map((member) => [member.userId, member]),
  );

  return players.map((player) => {
    const member = members.get(player.userId);

    return {
      userId: player.userId,
      selected: !!member,
      characterName: member?.characterName ?? player.characterName ?? '',
      characterLevel: member?.characterLevel ?? BASTION_START_LEVEL,
    };
  });
}

/**
 * Превращает отмеченные строки формы в состав бастиона для запроса.
 *
 * @param drafts Строки формы доступа.
 * @returns Игроки с доступом.
 */
export function toMemberRequests(
  drafts: ReadonlyArray<BastionMemberDraft>,
): Array<PlayerBastionMemberRequest> {
  return drafts
    .filter((draft) => draft.selected)
    .map((draft) => ({
      userId: draft.userId,
      characterName: draft.characterName.trim(),
      characterLevel: draft.characterLevel,
    }));
}

/**
 * Находит исходную ошибку запроса: `useAsyncData` оборачивает её в ошибку
 * Nuxt, и ответ сервера остаётся в `cause`.
 *
 * @param error Ошибка из `$fetch` или `useAsyncData`.
 * @returns Ошибка запроса или undefined.
 */
function findFetchError(error: unknown): FetchError | undefined {
  if (error instanceof FetchError) {
    return error;
  }

  if (error instanceof Error && error.cause instanceof FetchError) {
    return error.cause;
  }

  return undefined;
}

/**
 * Достаёт объяснение ошибки из ответа core-api. На 4xx в `message` лежит
 * текст для пользователя («Бастион уже изменили…»). На 503 — тоже: его отдаёт
 * сам core-api, когда не отвечает каталог игр. Остальные 5xx несут технический
 * текст (SQL, стек), его заменяет общая формулировка.
 *
 * @param error Ошибка запроса.
 * @param fallback Общая формулировка.
 * @returns Текст для пользователя.
 */
export function getBastionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const fetchError = findFetchError(error);

  if (!fetchError) {
    return fallback;
  }

  const status = fetchError.statusCode ?? 0;
  const message: unknown = fetchError.data?.message;

  const isReadable =
    (status >= 400 && status < 500) || status === SERVICE_UNAVAILABLE_STATUS;

  if (isReadable && typeof message === 'string' && message) {
    return message;
  }

  return fallback;
}
