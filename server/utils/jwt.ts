import type { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import type { H3Event } from 'h3';

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

const {
  api: { secret: apiSecret },
} = useRuntimeConfig();

export const generateJwt = ({ payload, options }: GenerateJwtConfig) =>
  jwt.sign(payload, apiSecret, options);

export const verifyJwt = <T extends JwtPayload>({
  token,
  options,
}: VerifyJwtConfig) => jwt.verify(token, apiSecret, options) as T;

export const getUserFromToken = (event: H3Event) => {
  const token = getTokenFromRequest(event);

  try {
    return jwt.verify(token, apiSecret) as AuthJwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw createError(getErrorResponse(StatusCodes.UNAUTHORIZED));
    }

    throw createError(getErrorResponse(StatusCodes.BAD_REQUEST));
  }
};

export const verifyToken = (event: H3Event) => {
  getUserFromToken(event);
};
