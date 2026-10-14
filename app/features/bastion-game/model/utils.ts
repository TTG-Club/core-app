import type {
  GamePlayer,
  PlayerBastion,
  PlayerBastionMemberRequest,
} from './schema';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import { BASTION_START_LEVEL, MY_BASTIONS_ROUTE } from './constants';

const SERVICE_UNAVAILABLE_STATUS = StatusCodes.SERVICE_UNAVAILABLE;
const CONFLICT_STATUS = StatusCodes.CONFLICT;

/** Строка формы доступа: игрок игры и его персонаж в бастионе. */
export interface BastionMemberDraft {
  userId: string;
  selected: boolean;
  characterName: string;
  characterLevel: number;
}

/**
 * Собирает строки формы доступа: нынешний состав бастиона отмечен и несёт
 * своих персонажей, остальные игроки игры — с именем персонажа из заявки и
 * стартовым уровнем бастиона. Вне игры игроков нет, и в форме только состав.
 *
 * @param players Игроки игры с одобренной заявкой.
 * @param bastion Редактируемый бастион.
 * @returns Строки формы: сначала состав, затем игроки игры.
 */
export function createMemberDrafts(
  players: ReadonlyArray<GamePlayer>,
  bastion?: PlayerBastion,
): Array<BastionMemberDraft> {
  const members = bastion?.members ?? [];
  const memberIds = new Set(members.map((member) => member.userId));

  // Сначала нынешний состав — в нём бывают не игроки игры (владелец-мастер
  // или участник из времени до игры), затем остальные игроки игры.
  return [
    ...members.map((member) => ({
      userId: member.userId,
      selected: true,
      characterName: member.characterName,
      characterLevel: member.characterLevel,
    })),
    ...players
      .filter((player) => !memberIds.has(player.userId))
      .map((player) => ({
        userId: player.userId,
        selected: false,
        characterName: player.characterName ?? '',
        characterLevel: BASTION_START_LEVEL,
      })),
  ];
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
 * Отказ из-за устаревшей версии: данные уже изменил кто-то другой.
 *
 * @param error Ошибка запроса.
 * @returns true для ответа 409.
 */
export function isBastionConflictError(error: unknown): boolean {
  return findFetchError(error)?.statusCode === CONFLICT_STATUS;
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

/**
 * Страница бастиона — одна для своих бастионов и для бастионов в игре.
 *
 * @param id Бастион.
 * @returns Путь страницы.
 */
export function getBastionRoute(id: string): string {
  return `${MY_BASTIONS_ROUTE}/${id}`;
}

/**
 * Страница плана бастиона.
 *
 * @param id Бастион.
 * @returns Путь страницы.
 */
export function getBastionPlanRoute(id: string): string {
  return `${getBastionRoute(id)}/plan`;
}

/**
 * Страница игры, в которую добавлен бастион.
 *
 * @param gameId Игра каталога.
 * @returns Путь страницы.
 */
export function getGameRoute(gameId: string): string {
  return `/games/${gameId}`;
}
