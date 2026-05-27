/** Цвет кисти для рисования на скриншоте */
export interface BrushColor {
  /** Уникальное название цвета */
  name: string;

  /** CSS-значение цвета */
  value: string;
}

/** Контекст выделенного текста для баг-репорта */
export interface TextSelection {
  /** Текст до выделения (~50 символов контекста) */
  before: string;

  /** Выделенный пользователем текст */
  selected: string;

  /** Текст после выделения (~50 символов контекста) */
  after: string;
}

/** Данные баг-репорта для отправки на сервер */
export interface BugReportPayload {
  /** Скриншот области экрана с аннотациями (PNG) или null, если не приложен */
  screenshot: Blob | null;

  /** Текст описания бага */
  description: string;

  /** Имя пользователя или null для анонимных репортов */
  author: string | null;

  /** URL страницы, с которой был сделан репорт */
  pageUrl: string;

  /** Контекст выделенного текста или null, если не выделяли */
  selectedText: TextSelection | null;

  /** Информация о браузере пользователя */
  userAgent: string;

  /** ISO-дата создания репорта */
  timestamp: string;
}
