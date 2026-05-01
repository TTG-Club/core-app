import type { JWTPayload } from 'jose';

export interface AuthJwtPayload extends JWTPayload {
  username: string;
  roles: string[];
}
