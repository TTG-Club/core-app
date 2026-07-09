import type { RenderNode } from '~ui/markup';

/** Ключ типа записи: новость или статья. */
export type ArticleType = 'NEWS' | 'ARTICLE';

/** Ключ статуса записи в ОТВЕТАХ API (для бейджа состояния). */
export type ArticleStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'INACTIVE';

/** Режим активной публикации в редакторе: опубликовать сейчас / запланировать. */
export type ArticlePublishMode = 'now' | 'schedule';

/** Состояние публикации в редакторе (сегментированный выбор). */
export type ArticlePubState = 'draft' | 'active' | 'inactive';

/**
 * Вкладка списка в админ-панели:
 * - `published` — активные (на сайте), эндпоинт `/search`;
 * - `unpublished` — не на сайте (снятые + запланированные), `/search/unpublished`;
 * - `draft` — черновики, тот же `/search/unpublished` (разделение по `status`).
 */
export type ArticleAdminTab = 'published' | 'unpublished' | 'draft';

/** Значение фильтра по типу (включая «все»). */
export type ArticleTypeFilter = 'all' | ArticleType;

/**
 * Тело запроса на создание/редактирование/предпросмотр записи, а также ответ
 * `GET /articles/{url}/raw` (форма для редактирования). Поля `preview` и
 * `content` — строки хранимой разметки (модель `MarkupEditor`).
 *
 * Публикация задаётся ДВУМЯ независимыми флагами (не `status`):
 * - `draft` — черновик: виден только в списке черновиков, недоступен на сайте и по ссылке;
 * - `active` — активность ОПУБЛИКОВАННОЙ записи (при `draft=false`): true — в общем
 *   доступе (с учётом даты), false — снята с сайта, но остаётся опубликованной (не черновик);
 * - `publishDateTime` — при `draft=false, active=true` будущая дата = запланирована,
 *   не задана = «сейчас»;
 * - `accessibleByLink` — при `draft=false, active=false` (неактивна) открыть по прямой ссылке;
 * - `publishToTelegram` — при сохранении продублировать новость в Telegram-канал;
 * - `publishToDiscord` — при сохранении продублировать новость в Discord через вебхук.
 */
export interface ArticleRequest {
  url: string;
  type: ArticleType;
  draft: boolean;
  active: boolean;
  accessibleByLink: boolean;
  publishToTelegram: boolean;
  publishToDiscord: boolean;
  title: string;
  previewImageUrl: string | null;
  publishDateTime: string | null;
  preview: string;
  content: string;
}

/** Элемент списков (`/search` и `/search/unpublished`). */
export interface ArticleShortResponse {
  id: string;
  url: string;
  type: ArticleType;
  typeName: string;
  draft: boolean;
  active: boolean;
  status: ArticleStatus;
  statusName: string;
  accessibleByLink: boolean;
  title: string;
  publishDateTime: string | null;
  previewImageUrl: string | null;
  preview: RenderNode;
}

/**
 * Полная запись для страницы чтения и предпросмотра. Поля `preview` и `content`
 * приходят разобранными в AST (`RenderNode`) и передаются в `MarkupRender`.
 */
export interface ArticleDetailedResponse {
  id: string;
  url: string;
  type: ArticleType;
  typeName: string;
  draft: boolean;
  active: boolean;
  status: ArticleStatus;
  statusName: string;
  accessibleByLink: boolean;
  title: string;
  previewImageUrl: string | null;
  publishDateTime: string | null;
  preview: RenderNode;
  content: RenderNode;
  createdAt: string;
  updatedAt: string;
}
