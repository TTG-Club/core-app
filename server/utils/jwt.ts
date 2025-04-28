import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import type { H3Event } from 'h3';
import type { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';

export interface GenerateJwtConfig {
  payload: object | Buffer;
  options?: SignOptions;
}

export interface VerifyJwtConfig {
  token: string;
  options?: Omit<VerifyOptions, 'complete'>;
}

export interface AuthJwtPayload extends JwtPayload {
  username: string;
  roles: Array<{
    id: number;
    name: string;
  }>;
}

export function generateJwt({ payload, options }: GenerateJwtConfig) {
  const { secret } = getApiSecrets();

  return jwt.sign(payload, secret, options);
}

export function verifyJwt<T extends JwtPayload>({
  token,
  options,
}: VerifyJwtConfig) {
  const { secret } = getApiSecrets();

  return jwt.verify(token, secret, options) as T;
}

export function getUserFromToken(event: H3Event) {
  const { secret } = getApiSecrets();
  const token = getTokenFromRequest(event);

  try {
    return jwt.verify(token, secret) as AuthJwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
    }

    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }
}

export function verifyToken(event: H3Event) {
  getUserFromToken(event);
}
