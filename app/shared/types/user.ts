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
  /**
   * Отображаемое имя — заменяет логин в UI (профиль, комментарии, рейтинги).
   * Хранится в core-api; null, если core-api недоступен, — тогда показываем логин.
   */
  displayName: string | null;
  roles: string[];
}
