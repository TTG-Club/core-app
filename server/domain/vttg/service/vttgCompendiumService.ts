import type { H3Event } from 'h3';

import type { VttgCompendiumChannel } from '#shared/consts';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import { assertAdminRole } from '#server/utils/getUser';

import {
  VTTG_COMPENDIUM_LOG_CONTEXT,
  VTTG_COMPENDIUM_REQUEST_TIMEOUT,
  VTTG_COMPENDIUM_UNAVAILABLE_MESSAGE,
  VTTG_COMPENDIUM_VERSION_PATH,
  vttgCompendiumApiErrorBodySchema,
} from '../model';

/** Запрос к версии компендиума: чтение или подъём. */
interface VttgCompendiumRequest {
  method: 'GET' | 'PUT';
  body?: { version: number };
}

/**
 * Ошибка для админки: статус и причина из ответа core-api канала — например,
 * 409 «Версия должна быть больше текущей». Без ответа — 502.
 *
 * @param channel канал, к которому шёл запрос
 * @param fetchFailure перехваченная ошибка запроса
 * @returns H3-ошибка для клиента
 */
function toCompendiumError(
  channel: VttgCompendiumChannel,
  fetchFailure: unknown,
): Error {
  consola.error(
    `${VTTG_COMPENDIUM_LOG_CONTEXT} ${channel}:`,
    fetchFailure instanceof Error ? fetchFailure.message : fetchFailure,
  );

  const responseStatus =
    fetchFailure instanceof FetchError && fetchFailure.statusCode
      ? fetchFailure.statusCode
      : StatusCodes.BAD_GATEWAY;

  const apiErrorBody = vttgCompendiumApiErrorBodySchema.safeParse(
    fetchFailure instanceof FetchError ? fetchFailure.data : undefined,
  );

  return createError(
    getErrorResponse(responseStatus, {
      message: apiErrorBody.success
        ? apiErrorBody.data.message
        : VTTG_COMPENDIUM_UNAVAILABLE_MESSAGE,
    }),
  );
}

/**
 * Читает или поднимает версию компендиума в core-api выбранного канала от
 * имени текущего администратора. Его SSO-токен принимают core-api обоих
 * каналов: вход у них общий (auth-service).
 *
 * @param event запрос к сайту
 * @param channel канал компендиума
 * @param compendiumRequest метод и тело запроса
 * @returns ответ core-api как есть — его проверяет страница
 */
export async function fetchVttgCompendiumVersion(
  event: H3Event,
  channel: VttgCompendiumChannel,
  compendiumRequest: VttgCompendiumRequest,
): Promise<unknown> {
  await assertAdminRole(event);

  const { vttg } = useRuntimeConfig(event);

  try {
    return await $fetch<unknown>(
      `${vttg.compendiumApiUrls[channel]}${VTTG_COMPENDIUM_VERSION_PATH}`,
      {
        method: compendiumRequest.method,
        body: compendiumRequest.body,
        headers: { authorization: `Bearer ${getTokenFromRequest(event)}` },
        timeout: VTTG_COMPENDIUM_REQUEST_TIMEOUT,
      },
    );
  } catch (fetchFailure) {
    throw toCompendiumError(channel, fetchFailure);
  }
}
