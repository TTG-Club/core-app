import type { H3Event } from 'h3';

import { jwtVerify } from 'jose';

import { getAuthSecrets } from './secrets';

/**
 * Разбирает и проверяет подпись токена сайта.
 * @param token Токен из запроса.
 */
export async function verifyJwt(token: string) {
  const { secret } = getAuthSecrets();
  const secretKey = new TextEncoder().encode(secret);

  const { payload } = await jwtVerify<AuthJwtPayload>(token, secretKey);

  return payload;
}

/**
 * Проверяет токен запроса, ничего не возвращая: нужен там, где важен сам
 * факт входа, а не данные пользователя.
 *
 * @param event Событие H3.
 */
export async function verifyToken(event: H3Event) {
  const token = getTokenFromRequest(event);

  await verifyJwt(token);
}
