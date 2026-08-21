/**
 * Платформы-источники и статусы переехали в `#shared/consts`: платформы общие с
 * комментариями, статусы нужны серверной ручке сводки по статусам, и держать их
 * в фиче значило бы дублировать значения, которые обязаны совпадать.
 * Реэкспорт оставлен, чтобы не переписывать импорты внутри фичи.
 */
import type { BugReportStatus, SourcePlatform } from '#shared/consts';

/** Контекст выделенного текста для баг-репорта */
export interface TextSelection {
  /** Текст до выделения (~50 символов контекста) */
  before: string;

  /** Выделенный пользователем текст */
  selected: string;

  /** Текст после выделения (~50 символов контекста) */
  after: string;
}

export type { BugReportStatus, SourcePlatform };

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

  /** Дата последнего изменения статуса (null — статус ещё не меняли) */
  statusUpdatedAt: string | null;

  /** Логин пользователя, последним изменившего статус (null — статус ещё не меняли) */
  statusUpdatedBy?: string | null;

  /** Комментарий при последнем изменении статуса */
  statusComment?: string;

  /** Выделенный текст на странице */
  selectedText?: string;
}

/**
 * Баг-репорт в личном кабинете его автора.
 *
 * Отдельный тип, а не `Omit` от `BugReportResponse`: это самостоятельный
 * контракт ручки `/my`, которая намеренно не отдаёт `statusUpdatedBy`,
 * `userLogin` и `sessionId` — автор не должен знать, кто менял статус и писал
 * комментарий.
 */
export interface MyBugReportResponse {
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

  /** Дата создания баг-репорта */
  createdAt: string;

  /** Дата последнего изменения статуса (null — статус ещё не меняли) */
  statusUpdatedAt: string | null;

  /** Комментарий команды к последнему изменению статуса */
  statusComment?: string;

  /** Выделенный текст на странице */
  selectedText?: string;
}

/** Ответ API с постраничным списком баг-репортов автора */
export interface PageMyBugReportResponse {
  /** Список баг-репортов на текущей странице */
  content: MyBugReportResponse[];

  /** Общее количество элементов */
  totalElements: number;

  /** Общее количество страниц */
  totalPages: number;

  /** Номер текущей страницы (0-indexed) */
  number: number;
}

/**
 * Снимок состояния репорта на момент последнего просмотра автором.
 * По нему определяется, что именно изменилось: статус или комментарий.
 */
export interface MyBugReportSeenSnapshot {
  /** Дата изменения статуса, которую автор уже видел */
  statusUpdatedAt: string;

  /** Статус, который автор уже видел */
  status: BugReportStatus;

  /** Комментарий команды, который автор уже видел */
  statusComment: string;
}

/** Что изменилось в репорте с прошлого просмотра */
export interface MyBugReportChanges {
  /** Есть непросмотренные изменения */
  isUnread: boolean;

  /** Сменился статус */
  hasStatusChange: boolean;

  /** Появился или изменился комментарий команды */
  hasCommentChange: boolean;
}

/** Сводка изменений по баг-репортам автора (индикатор «есть новости») */
export interface MyBugUpdatesResponse {
  /** Количество изменений статуса позже отметки последнего просмотра */
  count: number;

  /**
   * Самая свежая дата изменения статуса среди репортов автора.
   * `null` — статус ни одного репорта ещё не меняли.
   */
  lastStatusUpdatedAt: string | null;
}

/** Данные об обновлении статуса баг-репорта (событие компонентов админки) */
export interface BugReportStatusUpdatePayload {
  /** Уникальный идентификатор бага */
  id: string;

  /** Новый статус бага */
  status: BugReportStatus;

  /** Дата изменения статуса (приходит из ответа API, где поле обнуляемо) */
  statusUpdatedAt: string | null;

  /** Логин пользователя, изменившего статус (null — не менялся) */
  statusUpdatedBy?: string | null;

  /** Комментарий при изменении статуса */
  statusComment?: string;
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

/** Пользователь и количество решённых багов */
export interface BugReportUserFixedCount {
  /** Отображаемое имя пользователя (логин, если имя не задано) */
  name: string;

  /** Количество решённых багов */
  fixed: number;
}

/** Общая статистика по баг-репортам */
export interface BugReportStatsResponse {
  /** Общее количество баг-репортов */
  totalCount: number;

  /** Количество решённых баг-репортов (статус FIXED) */
  fixedCount: number;

  /** Топ-10 пользователей по количеству решённых багов */
  topFixers: BugReportUserFixedCount[];

  /** Количество решённых багов, созданных в текущем календарном месяце */
  fixedCountThisMonth: number;

  /** Топ-10 пользователей по решённым багам за текущий календарный месяц */
  topFixersThisMonth: BugReportUserFixedCount[];
}

/** Допустимые инструменты рисования */
export type DrawingTool = 'brush' | 'circle' | 'rectangle';
