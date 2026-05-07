import type { H3Event } from 'h3';

import { jwtVerify } from 'jose';

import { getAuthSecrets } from './secrets';

export async function verifyJwt(token: string) {
  const { secret } = getAuthSecrets();
  const secretKey = new TextEncoder().encode(secret);

  const { payload } = await jwtVerify<AuthJwtPayload>(token, secretKey);

  return payload;
}

export async function verifyToken(event: H3Event) {
  const token = getTokenFromRequest(event);

  await verifyJwt(token);
}
