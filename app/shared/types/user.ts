import type { TimestampResponse } from './base';

export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  WRITER = 'WRITER',
  SUBSCRIBER = 'SUBSCRIBER',
  USER = 'USER',
}

export interface UserProfile extends TimestampResponse {
  email: string;
  username: string;
  roles: Role[];
  statistics?: {
    ratingCount: number;
  };
}
