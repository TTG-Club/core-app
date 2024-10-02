import type { z } from 'zod';
import type { userSchema } from '~~/shared/zod/user';

export enum ROLE {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  WRITER = 'WRITER',
  SUBSCRIBER = 'SUBSCRIBER',
  USER = 'USER',
}

export type UserProfile = z.infer<typeof userSchema>;
