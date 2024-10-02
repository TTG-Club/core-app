import type { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { merge } from 'lodash-es';

export type TokenExpiredError = jwt.TokenExpiredError;

export interface GenerateJwtConfig {
  payload: object | Buffer;
  secret?: string;
  options?: SignOptions;
}

export interface VerifyJwtConfig {
  token: string;
  secret?: string;
  options?: VerifyOptions & { complete?: false };
}

export interface GenerateAuthJwtPayload {
  /**
   * string from `getRequestOrigin(event)`
   */
  origin: string;
  username: string;
  remember?: boolean;
}

const { apiSecret } = useRuntimeConfig();

export const generateJwt = ({
  payload,
  secret,
  options,
}: GenerateJwtConfig) => {
  const currentSecret = secret || apiSecret;

  const baseOptions: SignOptions = {
    expiresIn: '30d',
  };

  const mergedOptions = merge(baseOptions, options);

  return jwt.sign(payload, currentSecret, mergedOptions);
};

export const verifyJwt = <T = string | JwtPayload>({
  token,
  secret,
  options,
}: VerifyJwtConfig) => {
  const currentSecret = secret || apiSecret;

  return jwt.verify(token, currentSecret, options) as T;
};

export const generateAuthJwt = (payload: GenerateAuthJwtPayload) =>
  jwt.sign(payload, apiSecret, {
    expiresIn: payload.remember ? '30d' : '24h',
  });

export const verifyAuthJwt = (token: string) =>
  jwt.verify(token, apiSecret) as GenerateAuthJwtPayload;
