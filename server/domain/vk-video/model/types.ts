/** Подключение к ВК: ключи VK ID, которые сервер хранит и продлевает. */
export interface VkIdSession {
  accessToken: string;
  refreshToken: string;
  /** Когда истекает ключ доступа (мс с 1970 г.). */
  accessTokenExpiresAt: number;
  /** Id устройства из входа — без него VK ID не продлевает ключ. */
  deviceId: string;
  userId: string;
  /** Когда подключили (ISO). */
  connectedAt: string;
}

/** Незавершённый вход — содержимое cookie на время входа. */
export interface VkIdPendingLogin {
  state: string;
  codeVerifier: string;
  redirectUri: string;
}

/** Успешный ответ VK ID на обмен кода или продление. */
export interface VkIdTokens {
  accessToken: string;
  /** Новый ключ продления; VK ID может его не прислать. */
  refreshToken: string | null;
  /** Через сколько секунд истекает ключ доступа. */
  expiresIn: number;
  userId: string | null;
}

/** Одна картинка кадра ролика в ответе `video.get`. */
export interface VkVideoImage {
  url: string;
  width: number;
}
