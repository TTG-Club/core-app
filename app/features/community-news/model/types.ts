import type { RenderNode } from '~ui/markup';

/** Статус новости сообщества в ОТВЕТАХ API (для бейджа состояния). */
export type CommunityNewsStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'INACTIVE';

/** Состояние публикации в редакторе (сегментированный выбор). */
export type CommunityNewsPubState = 'draft' | 'active' | 'inactive';

/** Режим активной публикации: сразу / по расписанию. */
export type CommunityNewsPublishMode = 'now' | 'schedule';

/**
 * Вкладка списка в инструменте публикации:
 * - `published` — на сайте, эндпоинт `/search`;
 * - `unpublished` — снятые и запланированные, `/search/unpublished`;
 * - `draft` — черновики, тот же `/search/unpublished` (разделение по `status`).
 */
export type CommunityNewsAdminTab = 'published' | 'unpublished' | 'draft';

/**
 * Тело создания/правки/предпросмотра новости сообщества и ответ
 * `GET /community-news/{url}/raw`. `preview` и `content` — строки хранимой
 * разметки (модель `MarkupEditor`).
 *
 * - `authorName` — кто прислал новость или о ком она (мастер, клуб, канал);
 *   пустая строка — без подписи;
 * - `sourceUrl` — ссылка на первоисточник (пост, канал, страница клуба);
 * - `videoUrl` — ролик YouTube / ВК Видео вместо обложки (нормализованная
 *   ссылка, см. `parseVideoUrl`); обложка остаётся его заставкой;
 * - публикация — те же два флага, что у новостей сайта: `draft` (черновик) и
 *   `active` (на сайте или снята), будущая `publishDateTime` при активной =
 *   запланирована, `accessibleByLink` — открыть снятую по прямой ссылке.
 */
export interface CommunityNewsRequest {
  url: string;
  title: string;
  authorName: string;
  sourceUrl: string | null;
  previewImageUrl: string | null;
  videoUrl: string | null;
  draft: boolean;
  active: boolean;
  accessibleByLink: boolean;
  publishDateTime: string | null;
  preview: string;
  content: string;
}

/** Элемент списков (`/search` и `/search/unpublished`). */
export interface CommunityNewsShortResponse {
  id: string;
  url: string;
  title: string;
  authorName: string | null;
  sourceUrl: string | null;
  previewImageUrl: string | null;
  videoUrl: string | null;
  draft: boolean;
  active: boolean;
  status: CommunityNewsStatus;
  statusName: string;
  accessibleByLink: boolean;
  publishDateTime: string | null;
  preview: RenderNode;
}

/**
 * Полная новость для чтения и предпросмотра: `preview` и `content` приходят
 * разметкой (AST или сырой JSON-строкой — см. `toArticleMarkup`).
 */
export interface CommunityNewsDetailedResponse extends CommunityNewsShortResponse {
  content: RenderNode;
  createdAt: string;
  updatedAt: string;
}
