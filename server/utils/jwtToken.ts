import type { SignOptions, VerifyOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { merge } from 'lodash-es';

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
  username: UserDto['username'];
  remember?: boolean;
  origin: string;
}

export const useJwt = () => {
  const { apiSecret } = useRuntimeConfig();

  const generate = ({ payload, secret, options }: GenerateJwtConfig) => {
    const currentSecret = secret || apiSecret;
    const baseOptions: SignOptions = {
      expiresIn: '30d',
    };

    const mergedOptions = merge(baseOptions, options);

    return jwt.sign(payload, currentSecret, mergedOptions);
  };

  const verify = ({ token, secret, options }: VerifyJwtConfig) => {
    const currentSecret = secret || apiSecret;

    return jwt.verify(token, currentSecret, options);
  };

  const generateAuthJwt = (payload: GenerateAuthJwtPayload) =>
    jwt.sign(payload, apiSecret, {
      expiresIn: payload.remember ? '30d' : '24h',
    });

  const verifyAuthJwt = (token: string) => jwt.verify(token, apiSecret);

  return {
    generate,
    verify,
    generateAuthJwt,
    verifyAuthJwt,
  };
};
