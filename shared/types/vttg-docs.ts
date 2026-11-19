import type { VttgDocsChannel } from '../consts/vttg-docs';

/** Страница в оглавлении канала документации. */
export interface VttgDocsPageSummary {
  slug: string;
  title: string;
  /** Одна фраза о странице; `null` — сборка VTTG её не задала. */
  description: string | null;
}

/** Группа страниц в оглавлении: «Игровые системы», «Модули» и т. п. */
export interface VttgDocsGroup {
  slug: string;
  title: string;
  description: string | null;
  pages: VttgDocsPageSummary[];
}

/** Оглавление канала документации — то, что выложила последняя сборка VTTG. */
export interface VttgDocsIndex {
  channel: VttgDocsChannel;
  /** Версия VTTG, из которой выложены доки, например `0.9.330`. */
  version: string;
  /** Дата выкладки (ISO); `null` — сборка её не записала. */
  releaseDate: string | null;
  groups: VttgDocsGroup[];
}

/**
 * Ответ оглавления: `index: null` — канал ещё ни разу не выкладывался.
 * `channels` — каналы, которые доступны текущему посетителю.
 */
export interface VttgDocsIndexResponse {
  index: VttgDocsIndex | null;
  channels: VttgDocsChannel[];
}

/** Заголовок страницы для оглавления справа. */
export interface VttgDocsHeading {
  id: string;
  text: string;
  /** Уровень: 2 или 3. */
  depth: number;
}

/** Соседняя страница для ссылок «назад» и «дальше». */
export interface VttgDocsPageLink {
  groupSlug: string;
  pageSlug: string;
  title: string;
}

/** Адрес раздела для роутера: путь и query канала. */
export interface VttgDocsRoute {
  path: string;
  query: Record<string, string>;
}

/** Страница документации, готовая к показу. */
export interface VttgDocsPage {
  channel: VttgDocsChannel;
  version: string;
  releaseDate: string | null;
  group: Pick<VttgDocsGroup, 'slug' | 'title'>;
  page: VttgDocsPageSummary;
  /**
   * HTML тела страницы. Собран на сервере сайта из Markdown: сырой HTML из
   * исходника выброшен, ссылки переписаны под адреса сайта.
   */
  html: string;
  headings: VttgDocsHeading[];
  previous: VttgDocsPageLink | null;
  next: VttgDocsPageLink | null;
}

/**
 * Настройка раздела: какие роли видят dev-канал помимо администраторов (те
 * видят всегда). Строки, а не `Role`: роль, заведённая в core-api позже, чем
 * обновился сайт, тоже должна сохраняться и работать.
 */
export interface VttgDocsSettings {
  devChannelRoles: string[];
  /** Когда настройку сохранили (ISO); `null` — не сохраняли. */
  updatedAt: string | null;
  /** Кто сохранил настройку; `null` — не сохраняли. */
  updatedBy: string | null;
}

/** То, что администратор меняет в форме. */
export type VttgDocsSettingsUpdate = Pick<VttgDocsSettings, 'devChannelRoles'>;
