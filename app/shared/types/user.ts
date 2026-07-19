export enum Role {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  WRITER = 'WRITER',
  VTTG = 'VTTG',
  USER = 'USER',
}

export interface UserProfile {
  /** UUID пользователя (клейм `sub` токена); null у старых токенов без клейма. */
  id: string | null;
  email: string;
  username: string;
  roles: string[];
}
