import type {
  GamePlayer,
  PlayerBastion,
  PlayerBastionMemberRequest,
} from './schema';

import { FetchError } from 'ofetch';

import { BASTION_START_LEVEL } from './constants';

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
 * Достаёт объяснение ошибки из ответа core-api. На 4xx в `message` лежит
 * текст для пользователя («Бастион уже изменили…»), на 5xx — технический, его
 * заменяет общая формулировка.
 *
 * @param error Ошибка запроса.
 * @param fallback Общая формулировка.
 * @returns Текст для уведомления.
 */
export function getBastionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof FetchError)) {
    return fallback;
  }

  const status = error.statusCode ?? 0;
  const message: unknown = error.data?.message;

  if (status >= 400 && status < 500 && typeof message === 'string' && message) {
    return message;
  }

  return fallback;
}
