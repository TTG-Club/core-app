import type { VkVideoConnectionStatus } from '#shared/types';

import type { VkIdSession, VkIdTokens } from '../model';

import crypto from 'node:crypto';

import { S3Service } from '#server/domain/s3';

import {
  VK_ID_APP_ID,
  VK_ID_BASE_URL,
  VK_ID_REFRESH_MARGIN_MS,
  VK_ID_SESSION_FILENAME,
  VK_ID_SESSION_KEY_PREFIX,
  VK_ID_SESSION_LOST_ERRORS,
  VK_ID_STATE_BYTES,
  VK_REQUEST_TIMEOUT_MS,
  VK_VIDEO_LOG,
  vkIdErrorResponseSchema,
  vkIdSessionSchema,
  vkIdTokenResponseSchema,
} from '../model';

/** Шифр файла подключения и длина его служебных частей. */
const CIPHER_ALGORITHM = 'aes-256-gcm';
const CIPHER_IV_BYTES = 12;
const CIPHER_KEY_SALT = 'ttg:vk-video-session';

/**
 * Ошибка VK ID с его кодом (`invalid_grant` и т. п.) — по коду решаем,
 * снимать ли подключение.
 */
export class VkIdError extends Error {
  constructor(
    readonly code: string,
    description?: string,
  ) {
    super(description ? `${code}: ${description}` : code);
    this.name = 'VkIdError';
  }
}

/**
 * Идущие продления по пользователям сайта: параллельные запросы одного
 * редактора ждут продление, а не продлевают сами.
 */
const activeRefreshes = new Map<string, Promise<VkIdSession>>();

/**
 * Файл подключения редактора. У каждого свой: редактор подключает свой
 * аккаунт ВК и чужим не пользуется.
 *
 * @param username пользователь сайта
 */
function getSessionKey(username: string): string {
  return `${VK_ID_SESSION_KEY_PREFIX}${getSlug(username)}.json`;
}

/**
 * Ключ шифрования файлов подключения. Файлы лежат в служебной папке, закрытой
 * от публичного роута, а шифр — вторая защита на случай чужого доступа к
 * хранилищу. Выводится из секрета подписи токенов: при его смене файлы просто
 * не прочитаются и ВК нужно подключить заново.
 */
function getCipherKey(): Buffer {
  return crypto
    .createHash('sha256')
    .update(`${CIPHER_KEY_SALT}:${getAuthSecrets().secret}`)
    .digest();
}

/**
 * Шифрует подключение для записи в хранилище.
 *
 * @param session ключи VK ID
 * @returns строка `iv.tag.шифротекст` в base64url
 */
function encryptSession(session: VkIdSession): string {
  const iv = crypto.randomBytes(CIPHER_IV_BYTES);
  const cipher = crypto.createCipheriv(CIPHER_ALGORITHM, getCipherKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final(),
  ]);

  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString('base64url'))
    .join('.');
}

/**
 * Расшифровывает и проверяет файл подключения.
 *
 * @param payload содержимое файла
 * @returns ключи VK ID
 */
function decryptSession(payload: string): VkIdSession {
  const [iv = '', tag = '', encrypted = ''] = payload.trim().split('.');

  const decipher = crypto.createDecipheriv(
    CIPHER_ALGORITHM,
    getCipherKey(),
    Buffer.from(iv, 'base64url'),
  );

  decipher.setAuthTag(Buffer.from(tag, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');

  return vkIdSessionSchema.parse(JSON.parse(decrypted));
}

/**
 * Читает подключение редактора из хранилища; нет файла или он не читается —
 * `null`. Ключи нужны только при правке записей, поэтому читаем каждый раз,
 * без памяти: так копии сайта (D&D 2014 делит хранилище) не расходятся.
 *
 * @param username пользователь сайта
 */
async function readSession(username: string): Promise<VkIdSession | null> {
  try {
    const object = await S3Service.get(getSessionKey(username));
    const payload = await object.Body?.transformToString();

    return payload ? decryptSession(payload) : null;
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return null;
    }

    consola.warn(VK_VIDEO_LOG, 'Файл подключения не прочитан:', error);

    return null;
  }
}

/**
 * Сохраняет подключение редактора.
 *
 * @param username пользователь сайта
 * @param session ключи VK ID
 */
export async function saveVkIdSession(
  username: string,
  session: VkIdSession,
): Promise<void> {
  await S3Service.upload({
    name: VK_ID_SESSION_FILENAME,
    path: getSessionKey(username),
    type: 'text/plain',
    data: Buffer.from(encryptSession(session)),
  });
}

/**
 * Гасит ключ в самом ВК, чтобы удалённый у нас ключ не продолжал работать.
 * Сбой не мешает отключению: ключ доступа всё равно истечёт за час.
 *
 * @param session подключение
 */
async function revokeVkIdSession(session: VkIdSession): Promise<void> {
  try {
    await $fetch(`${VK_ID_BASE_URL}/oauth2/revoke`, {
      method: 'POST',
      body: new URLSearchParams({
        // eslint-disable-next-line camelcase -- имена параметров задаёт VK ID
        client_id: VK_ID_APP_ID,
        // eslint-disable-next-line camelcase -- имена параметров задаёт VK ID
        access_token: session.accessToken,
      }),
      timeout: VK_REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    consola.warn(VK_VIDEO_LOG, 'Ключ в ВК не погашен:', error);
  }
}

/**
 * Отключает ВК редактора: гасит ключ в ВК и удаляет файл.
 *
 * @param username пользователь сайта
 */
export async function deleteVkIdSession(username: string): Promise<void> {
  const session = await readSession(username);

  if (session) {
    await revokeVkIdSession(session);
  }

  try {
    await S3Service.delete(getSessionKey(username));
  } catch (error) {
    consola.warn(VK_VIDEO_LOG, 'Файл подключения не удалён:', error);
  }
}

/**
 * Запрос к VK ID (`/oauth2/auth`): обмен кода или продление ключа. Ошибку
 * VK ID отдаёт телом с кодом 4xx — разбираем её сами.
 *
 * @param params параметры формы запроса
 * @returns проверенные ключи
 */
export async function requestVkIdTokens(
  params: Record<string, string>,
): Promise<VkIdTokens> {
  const responseBody = await $fetch<unknown>(`${VK_ID_BASE_URL}/oauth2/auth`, {
    method: 'POST',
    body: new URLSearchParams(params),
    timeout: VK_REQUEST_TIMEOUT_MS,
    ignoreResponseError: true,
  });

  const errorResponse = vkIdErrorResponseSchema.safeParse(responseBody);

  if (errorResponse.success) {
    throw new VkIdError(
      errorResponse.data.error,
      errorResponse.data.error_description,
    );
  }

  const tokenResponse = vkIdTokenResponseSchema.safeParse(responseBody);

  if (!tokenResponse.success) {
    throw new VkIdError('invalid_response', 'в ответе нет ключей');
  }

  return {
    accessToken: tokenResponse.data.access_token,
    refreshToken: tokenResponse.data.refresh_token ?? null,
    expiresIn: tokenResponse.data.expires_in,
    userId: tokenResponse.data.user_id ?? null,
  };
}

/**
 * Собирает подключение из ответа VK ID. При продлении VK ID может не
 * прислать новый ключ продления или id пользователя — тогда остаются прежние.
 *
 * @param tokens ключи из ответа VK ID
 * @param base данные входа или прежнее подключение
 * @param base.deviceId id устройства из входа
 * @param base.connectedAt когда подключили
 * @param base.refreshToken прежний ключ продления
 * @param base.userId прежний id пользователя
 * @returns подключение для хранения
 */
export function toVkIdSession(
  tokens: VkIdTokens,
  base: Pick<VkIdSession, 'deviceId' | 'connectedAt'>
    & Partial<Pick<VkIdSession, 'refreshToken' | 'userId'>>,
): VkIdSession {
  const refreshToken = tokens.refreshToken ?? base.refreshToken;

  if (!refreshToken) {
    throw new VkIdError('invalid_response', 'в ответе нет ключа продления');
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken,
    accessTokenExpiresAt: Date.now() + tokens.expiresIn * 1000,
    deviceId: base.deviceId,
    userId: tokens.userId ?? base.userId ?? '',
    connectedAt: base.connectedAt,
  };
}

/**
 * Продлевает ключ. VK ID при каждом продлении выдаёт новый ключ продления, а
 * старый гасит, — поэтому сразу сохраняем. Ключ, который уже не продлить,
 * снимает подключение.
 *
 * @param username пользователь сайта
 * @param session текущее подключение
 */
async function refreshSession(
  username: string,
  session: VkIdSession,
): Promise<VkIdSession> {
  try {
    /* eslint-disable camelcase -- имена параметров задаёт VK ID / VK API */
    const tokens = await requestVkIdTokens({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: VK_ID_APP_ID,
      device_id: session.deviceId,
      state: crypto.randomBytes(VK_ID_STATE_BYTES).toString('base64url'),
    });
    /* eslint-enable camelcase */

    const refreshed = toVkIdSession(tokens, session);

    await saveVkIdSession(username, refreshed);

    return refreshed;
  } catch (error) {
    if (
      error instanceof VkIdError
      && VK_ID_SESSION_LOST_ERRORS.includes(error.code)
    ) {
      // Другая копия сайта успела продлить ключ — подключение живо.
      const latest = await readSession(username);

      if (latest && latest.refreshToken !== session.refreshToken) {
        return latest;
      }

      consola.warn(
        VK_VIDEO_LOG,
        'Ключ ВК не продлился, подключение снято:',
        error.message,
      );

      await S3Service.delete(getSessionKey(username)).catch(() => undefined);
    }

    throw error;
  }
}

/**
 * Действующий ключ VK API редактора; истекающий продлевается.
 *
 * @param username пользователь сайта
 * @param force продлить, даже если срок не вышел (VK API отверг ключ)
 * @returns ключ или `null`, если редактор не подключил ВК
 */
export async function getVkAccessToken(
  username: string,
  force = false,
): Promise<string | null> {
  const session = await readSession(username);

  if (!session) {
    return null;
  }

  const isExpiring =
    session.accessTokenExpiresAt - VK_ID_REFRESH_MARGIN_MS <= Date.now();

  if (!force && !isExpiring) {
    return session.accessToken;
  }

  let refresh = activeRefreshes.get(username);

  if (!refresh) {
    refresh = refreshSession(username, session).finally(() => {
      activeRefreshes.delete(username);
    });

    activeRefreshes.set(username, refresh);
  }

  return (await refresh).accessToken;
}

/**
 * Подключён ли ВК у редактора.
 *
 * @param username пользователь сайта
 */
export async function getVkVideoConnectionStatus(
  username: string,
): Promise<VkVideoConnectionStatus> {
  const session = await readSession(username);

  return {
    connected: !!session,
    userId: session?.userId ? session.userId : null,
    connectedAt: session?.connectedAt ?? null,
  };
}
