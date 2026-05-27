/** Контекст выделенного текста для баг-репорта */
export interface TextSelection {
  /** Текст до выделения (~50 символов контекста) */
  before: string;

  /** Выделенный пользователем текст */
  selected: string;

  /** Текст после выделения (~50 символов контекста) */
  after: string;
}

/** Допустимые платформы-источники баг-репорта */
export type SourcePlatform = 'SITE_5E24' | 'SITE_5E14' | 'VTTG';

/** Запрос на создание баг-репорта для API */
export interface BugReportCreateRequest {
  /** Описание бага */
  description: string;

  /** URL страницы, на которой обнаружен баг */
  url?: string;

  /** Платформа-источник бага */
  sourcePlatform: SourcePlatform;

  /** Идентификатор сессии (если не авторизован) */
  sessionId?: string;

  /** Выделенный текст на странице */
  selectedText?: string;
}

/** Допустимые статусы баг-репорта */
export type BugReportStatus = 'NEW' | 'WAIT' | 'FIXED' | 'REJECTED';

/** Результат парсинга выделенного текста с контекстом */
export interface ParsedSelection {
  /** Текст до выделенного фрагмента */
  before: string;

  /** Выделенный фрагмент */
  selected: string;

  /** Текст после выделенного фрагмента */
  after: string;

  /** Был ли найден выделенный фрагмент в скобках */
  hasSelection: boolean;
}

/** Ответ API на создание баг-репорта */
export interface BugReportResponse {
  /** Уникальный идентификатор бага */
  id: string;

  /** Описание бага */
  description: string;

  /** URL страницы, на которой обнаружен баг */
  url?: string;

  /** Текущий статус бага */
  status: BugReportStatus;

  /** Платформа-источник */
  sourcePlatform: SourcePlatform;

  /** URL скриншота в S3-хранилище */
  screenshotUrl?: string;

  /** Логин пользователя */
  userLogin?: string;

  /** Идентификатор сессии */
  sessionId?: string;

  /** Дата создания баг-репорта */
  createdAt: string;

  /** Дата последнего изменения статуса */
  statusUpdatedAt: string;

  /** Комментарий при последнем изменении статуса */
  statusComment?: string;

  /** Выделенный текст на странице */
  selectedText?: string;
}

/** Цвет кисти для рисования на скриншоте */
export interface BrushColor {
  /** Уникальное название цвета */
  name: string;

  /** CSS-значение цвета */
  value: string;
}

/** Ответ API с постраничным списком баг-репортов */
export interface PageBugReportResponse {
  /** Список баг-репортов на текущей странице */
  content: BugReportResponse[];

  /** Общее количество элементов */
  totalElements: number;

  /** Общее количество страниц */
  totalPages: number;

  /** Размер страницы */
  size: number;

  /** Номер текущей страницы (0-indexed) */
  number: number;

  /** Является ли текущая страница первой */
  first: boolean;

  /** Является ли текущая страница последней */
  last: boolean;

  /** Пуст ли список элементов */
  empty: boolean;
}

/** Количество багов по статусу */
export interface BugCountByStatusResponse {
  /** Статус бага */
  status: BugReportStatus;

  /** Количество багов с данным статусом */
  count: number;
}
