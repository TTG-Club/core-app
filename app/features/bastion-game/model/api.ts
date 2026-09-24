import type {
  CatalogFacility,
  CreatePlayerBastionRequest,
  FacilitySetupRequest,
  PlayerBastion,
  PlayerBastionGame,
  UpdatePlayerBastionRequest,
} from './schema';

import {
  BASTION_FACILITY_CATALOG_API_PATH,
  PLAYER_BASTIONS_API_PATH,
} from './constants';
import {
  catalogFacilitiesSchema,
  playerBastionGameSchema,
  playerBastionSchema,
} from './schema';

/**
 * Все сооружения справочника — для экрана стартового выбора. Справочник
 * небольшой (около тридцати сооружений), поэтому грузится одним запросом.
 *
 * @returns Сооружения справочника.
 */
export async function fetchFacilityCatalog(): Promise<Array<CatalogFacility>> {
  const response = await $fetch<unknown>(BASTION_FACILITY_CATALOG_API_PATH, {
    method: 'GET',
    retry: 0,
  });

  return catalogFacilitiesSchema.parse(response);
}

/**
 * Сохраняет стартовый выбор сооружений персонажа целиком.
 *
 * @param bastionId Бастион.
 * @param memberId Персонаж в бастионе.
 * @param request Базовые и специализированные сооружения и версия бастиона.
 * @returns Бастион после сохранения.
 */
export async function updateMemberFacilities(
  bastionId: string,
  memberId: string,
  request: FacilitySetupRequest,
): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${bastionId}/members/${memberId}/facilities`,
    { method: 'PUT', body: request, retry: 0 },
  );

  return playerBastionSchema.parse(response);
}

/**
 * Мастер подтверждает или снимает подтверждение требования сооружения.
 *
 * @param bastionId Бастион.
 * @param facilityId Сооружение персонажа.
 * @param confirmed Подтвердить или снять подтверждение.
 * @returns Бастион после сохранения.
 */
export async function confirmFacilityPrerequisite(
  bastionId: string,
  facilityId: string,
  confirmed: boolean,
): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${bastionId}/facilities/${facilityId}/prerequisite`,
    { method: 'PUT', body: { confirmed }, retry: 0 },
  );

  return playerBastionSchema.parse(response);
}

/**
 * Бастионы игры и, для мастера, игроки, которым можно дать доступ.
 * Bearer-токен подставляет серверный прокси из куки.
 *
 * @param gameId Игра каталога.
 * @returns Бастионы игры.
 */
export async function fetchGameBastions(
  gameId: string,
): Promise<PlayerBastionGame> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/games/${gameId}`,
    { method: 'GET', retry: 0 },
  );

  return playerBastionGameSchema.parse(response);
}

/**
 * Бастион по идентификатору.
 *
 * @param id Бастион.
 * @returns Бастион глазами открывшего.
 */
export async function fetchPlayerBastion(id: string): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(`${PLAYER_BASTIONS_API_PATH}/${id}`, {
    method: 'GET',
    retry: 0,
  });

  return playerBastionSchema.parse(response);
}

/**
 * Создаёт бастион. Доступно только мастеру игры.
 *
 * @param request Игра, название и игроки с доступом.
 * @returns Созданный бастион.
 */
export async function createPlayerBastion(
  request: CreatePlayerBastionRequest,
): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(PLAYER_BASTIONS_API_PATH, {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return playerBastionSchema.parse(response);
}

/**
 * Меняет название и состав игроков. Доступно только мастеру игры.
 *
 * @param id Бастион.
 * @param request Новое название, состав и версия, с которой начата правка.
 * @returns Сохранённый бастион.
 */
export async function updatePlayerBastion(
  id: string,
  request: UpdatePlayerBastionRequest,
): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(`${PLAYER_BASTIONS_API_PATH}/${id}`, {
    method: 'PUT',
    body: request,
    retry: 0,
  });

  return playerBastionSchema.parse(response);
}

/**
 * Отправляет бастион в архив. Доступно только мастеру игры.
 *
 * @param id Бастион.
 * @returns Бастион в архиве.
 */
export async function archivePlayerBastion(id: string): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${id}/archive`,
    { method: 'POST', retry: 0 },
  );

  return playerBastionSchema.parse(response);
}
