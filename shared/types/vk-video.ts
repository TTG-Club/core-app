/** Подключён ли ВК у текущего редактора — ответ админского роута. */
export interface VkVideoConnectionStatus {
  connected: boolean;
  /** Id аккаунта ВК, через который подключено. */
  userId: string | null;
  /** Когда подключили (ISO). */
  connectedAt: string | null;
}

/** Начало входа через VK ID: куда отправить окно входа. */
export interface VkVideoLoginStart {
  authorizeUrl: string;
}

/** Ролик ВК: владелец, id и ключ доступа закрытого ролика. */
export interface VkVideoId {
  ownerId: string;
  videoId: string;
  hash: string | null;
}

/** Запрос «кадр ролика → обложка записи». */
export interface VkVideoCoverRequest extends VkVideoId {
  /** Раздел загрузок обложки (как у формы загрузки). */
  section: string;
  /** Предел размера картинки для компрессора. */
  maxSize?: number;
}

/** Взятая обложка — как ответ обычной загрузки. */
export interface VkVideoCoverResponse {
  filename: string;
  url: string;
}
