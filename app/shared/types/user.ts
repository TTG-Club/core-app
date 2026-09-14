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
  /**
   * Ссылка на аватарку в хранилище сайта (`/s3/avatars/...`). Хранится в
   * core-api рядом с отображаемым именем; null — аватарки нет или core-api
   * недоступен, тогда показываются инициалы.
   */
  avatarUrl: string | null;
  roles: string[];
  /**
   * Подтверждён ли адрес почты. Часть действий (создание игры) сервисы
   * отдают только подтверждённому аккаунту.
   */
  emailVerified: boolean;
}

/**
 * Публичные данные другого пользователя из core-api — то, что видно всем в
 * комментариях, играх и рейтингах: без логина и почты.
 */
export interface PublicUserProfile {
  /** UUID пользователя (клейм `sub` токена). */
  userId: string;
  displayName: string;
  /** Ссылка на аватарку в хранилище сайта; null — аватарки нет. */
  avatarUrl: string | null;
}
