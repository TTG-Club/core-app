import type { PlanState } from './plan-schema';
import type {
  BastionEditor,
  BastionShareAccess,
  PlayerBastion,
  SharedPlayerBastion,
} from './schema';

import { z } from 'zod';

import { PLAYER_BASTIONS_API_PATH } from './constants';
import { parsePlanResponse } from './plan-edit';
import {
  BASTION_SHARE_ACCESSES,
  bastionEditorsSchema,
  playerBastionSchema,
  sharedPlayerBastionSchema,
} from './schema';

/** Ручки бастиона по ссылке: читать может кто угодно, включая анонима. */
const SHARED_API_PATH = `${PLAYER_BASTIONS_API_PATH}/shared`;

/**
 * Включает ссылку «поделиться»; если она уже есть, сервер вернёт ту же.
 *
 * @param bastionId Бастион.
 * @returns Бастион с секретом ссылки.
 */
export async function shareBastion(bastionId: string): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${bastionId}/share`,
    { method: 'POST', retry: 0 },
  );

  return playerBastionSchema.parse(response);
}

/**
 * Отключает ссылку и снимает все права на правку.
 *
 * @param bastionId Бастион.
 * @returns Бастион без ссылки.
 */
export async function revokeBastionShare(
  bastionId: string,
): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${bastionId}/share`,
    { method: 'DELETE', retry: 0 },
  );

  return playerBastionSchema.parse(response);
}

/**
 * Запросы на правку и выданные права — для владельца.
 *
 * @param bastionId Бастион.
 * @returns Запросы, старые первыми.
 */
export async function fetchBastionEditors(
  bastionId: string,
): Promise<Array<BastionEditor>> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${bastionId}/editors`,
    { method: 'GET', retry: 0 },
  );

  return bastionEditorsSchema.parse(response);
}

/**
 * Разрешает править бастион.
 *
 * @param bastionId Бастион.
 * @param editorId Запрос.
 * @returns Запросы после решения.
 */
export async function approveBastionEditor(
  bastionId: string,
  editorId: string,
): Promise<Array<BastionEditor>> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${bastionId}/editors/${editorId}/approve`,
    { method: 'POST', retry: 0 },
  );

  return bastionEditorsSchema.parse(response);
}

/**
 * Отклоняет запрос или отзывает выданное право.
 *
 * @param bastionId Бастион.
 * @param editorId Запрос.
 * @returns Запросы после решения.
 */
export async function removeBastionEditor(
  bastionId: string,
  editorId: string,
): Promise<Array<BastionEditor>> {
  const response = await $fetch<unknown>(
    `${PLAYER_BASTIONS_API_PATH}/${bastionId}/editors/${editorId}`,
    { method: 'DELETE', retry: 0 },
  );

  return bastionEditorsSchema.parse(response);
}

/**
 * Бастион по ссылке: только чтение. Неизвестная или отозванная ссылка — 404.
 *
 * @param token Секрет ссылки.
 * @returns Бастион и доступ открывшего.
 */
export async function fetchSharedBastion(
  token: string,
): Promise<SharedPlayerBastion> {
  const response = await $fetch<unknown>(`${SHARED_API_PATH}/${token}`, {
    method: 'GET',
    retry: 0,
  });

  return sharedPlayerBastionSchema.parse(response);
}

/**
 * План бастиона по ссылке: только чтение.
 *
 * @param token Секрет ссылки.
 * @returns План без права правки.
 */
export async function fetchSharedBastionPlan(
  token: string,
): Promise<PlanState> {
  const response = await $fetch<unknown>(`${SHARED_API_PATH}/${token}/plan`, {
    method: 'GET',
    retry: 0,
  });

  return parsePlanResponse(response);
}

/**
 * Просит у владельца право править бастион.
 *
 * @param token Секрет ссылки.
 * @returns Доступ после запроса.
 */
export async function requestBastionEdit(
  token: string,
): Promise<BastionShareAccess> {
  const response = await $fetch<unknown>(
    `${SHARED_API_PATH}/${token}/edit-request`,
    { method: 'POST', retry: 0 },
  );

  return z.enum(BASTION_SHARE_ACCESSES).parse(response);
}
