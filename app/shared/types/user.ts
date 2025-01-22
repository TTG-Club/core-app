import type { Timestamp } from './base';

export enum ROLE {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  WRITER = 'WRITER',
  SUBSCRIBER = 'SUBSCRIBER',
  USER = 'USER',
}

export interface UserProfile extends Timestamp {
  email: string;
  username: string;
  roles: ROLE[];
}
