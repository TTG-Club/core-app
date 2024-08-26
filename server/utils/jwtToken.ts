import type { SignOptions, VerifyOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { merge } from 'lodash-es';

export const useJwtToken = () => {
  const { apiSecret } = useRuntimeConfig();

  const generate = (
    payload: object | Buffer,
    secret = apiSecret,
    options?: SignOptions,
  ) => {
    const baseOptions: SignOptions = {
      expiresIn: '30d',
    };

    const mergedOptions = merge(baseOptions, options);

    console.log(mergedOptions);

    return jwt.sign(payload, secret, mergedOptions);
  };

  const verify = (
    token: string,
    secret = apiSecret,
    options?: VerifyOptions & { complete?: false },
  ) => jwt.verify(token, secret, options);

  return {
    generate,
    verify,
  };
};
