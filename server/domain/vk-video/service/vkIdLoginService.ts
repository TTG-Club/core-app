import type { H3Event } from 'h3';

import type { VkIdPendingLogin } from '../model';

import crypto from 'node:crypto';

import { z } from 'zod';

import { VK_VIDEO_ADMIN_CALLBACK_API_PATH } from '#shared/consts';

import {
  VK_ID_APP_ID,
  VK_ID_BASE_URL,
  VK_ID_CODE_VERIFIER_BYTES,
  VK_ID_LOGIN_COOKIE,
  VK_ID_LOGIN_COOKIE_MAX_AGE_SECONDS,
  VK_ID_SCOPE,
  VK_ID_STATE_BYTES,
  vkIdPendingLoginSchema,
} from '../model';
import {
  requestVkIdTokens,
  saveVkIdSession,
  toVkIdSession,
  VkIdError,
} from './vkIdSessionService';

/** Параметры возврата из VK ID: код входа или ошибка. */
const callbackQuerySchema = z.object({
  code: z.string().optional(),
  // eslint-disable-next-line camelcase -- имя параметра задаёт VK ID
  device_id: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  // eslint-disable-next-line camelcase -- имя параметра задаёт VK ID
  error_description: z.string().optional(),
});

/** Настройки cookie незавершённого входа. */
interface LoginCookieOptions {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
}

/**
 * Адрес возврата на тот же сайт, с которого начали вход.
 *
 * @param event запрос редактора
 */
function getRedirectUri(event: H3Event): string {
  const { origin } = getRequestURL(event, {
    xForwardedHost: true,
    xForwardedProto: true,
  });

  return `${origin}${VK_VIDEO_ADMIN_CALLBACK_API_PATH}`;
}

/**
 * Cookie входа видна только адресу возврата и живёт до конца входа.
 *
 * @param event запрос редактора
 */
function getLoginCookieOptions(event: H3Event): LoginCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: getRequestProtocol(event, { xForwardedProto: true }) === 'https',
    path: VK_VIDEO_ADMIN_CALLBACK_API_PATH,
  };
}

/**
 * Начинает вход через VK ID (PKCE): готовит проверочные строки, кладёт их в
 * cookie редактора и возвращает адрес страницы входа ВК.
 *
 * @param event запрос редактора
 * @returns адрес страницы входа ВК
 */
export function startVkIdLogin(event: H3Event): string {
  const pending: VkIdPendingLogin = {
    state: crypto.randomBytes(VK_ID_STATE_BYTES).toString('base64url'),
    codeVerifier: crypto
      .randomBytes(VK_ID_CODE_VERIFIER_BYTES)
      .toString('base64url'),
    redirectUri: getRedirectUri(event),
  };

  setCookie(event, VK_ID_LOGIN_COOKIE, JSON.stringify(pending), {
    ...getLoginCookieOptions(event),
    maxAge: VK_ID_LOGIN_COOKIE_MAX_AGE_SECONDS,
  });

  const url = new URL(`${VK_ID_BASE_URL}/authorize`);

  /* eslint-disable camelcase -- имена параметров задаёт VK ID / VK API */
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: VK_ID_APP_ID,
    redirect_uri: pending.redirectUri,
    state: pending.state,
    code_challenge: crypto
      .createHash('sha256')
      .update(pending.codeVerifier)
      .digest('base64url'),
    code_challenge_method: 'S256',
    scope: VK_ID_SCOPE,
  }).toString();
  /* eslint-enable camelcase */

  return url.toString();
}

/**
 * Читает и сразу удаляет cookie незавершённого входа: вход одноразовый.
 *
 * @param event возврат из VK ID
 * @returns незавершённый вход или `null`, если cookie нет или она испорчена
 */
function readPendingLogin(event: H3Event): VkIdPendingLogin | null {
  const cookieValue = getCookie(event, VK_ID_LOGIN_COOKIE);

  deleteCookie(event, VK_ID_LOGIN_COOKIE, getLoginCookieOptions(event));

  if (!cookieValue) {
    return null;
  }

  try {
    const parsed = vkIdPendingLoginSchema.safeParse(JSON.parse(cookieValue));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Завершает вход: сверяет state, меняет код на ключи и сохраняет подключение
 * редактора.
 *
 * @param event возврат из VK ID с `code`, `device_id` и `state`
 * @param username пользователь сайта, который подключает свой ВК
 */
export async function completeVkIdLogin(
  event: H3Event,
  username: string,
): Promise<void> {
  const pending = readPendingLogin(event);
  const parsedQuery = callbackQuerySchema.safeParse(getQuery(event));

  if (!parsedQuery.success) {
    throw new VkIdError('invalid_redirect', 'адрес возврата не разобран');
  }

  const query = parsedQuery.data;

  if (query.error) {
    throw new VkIdError(query.error, query.error_description);
  }

  if (!pending || query.state !== pending.state) {
    throw new VkIdError('state_mismatch', 'вход устарел, начните заново');
  }

  const code = query.code;
  const deviceId = query.device_id;

  if (!code || !deviceId) {
    throw new VkIdError('invalid_redirect', 'в адресе возврата нет кода');
  }

  /* eslint-disable camelcase -- имена параметров задаёт VK ID / VK API */
  const tokens = await requestVkIdTokens({
    grant_type: 'authorization_code',
    code,
    code_verifier: pending.codeVerifier,
    redirect_uri: pending.redirectUri,
    client_id: VK_ID_APP_ID,
    device_id: deviceId,
    state: pending.state,
  });
  /* eslint-enable camelcase */

  await saveVkIdSession(
    username,
    toVkIdSession(tokens, {
      deviceId,
      connectedAt: new Date().toISOString(),
    }),
  );
}
