import type { VttgDocsChannel } from '../consts/vttg-docs';
import type {
  VttgDocsPageLink,
  VttgDocsRoute,
  VttgDocsSettings,
  VttgDocsSettingsUpdate,
} from '../types/vttg-docs';

import { uniq } from 'es-toolkit';
import { z } from 'zod';

import {
  VTTG_DOCS_CHANNELS,
  VTTG_DOCS_DEFAULT_CHANNEL,
  VTTG_DOCS_DEV_CHANNEL,
  VTTG_DOCS_DEV_ROLES_MAX_COUNT,
  VTTG_DOCS_ROLE_MAX_LENGTH,
  VTTG_DOCS_ROLE_PATTERN,
  VTTG_DOCS_ROUTE,
  VTTG_DOCS_SLUG_PATTERN,
} from '../consts/vttg-docs';

/** Схема канала документации. */
export const vttgDocsChannelSchema: z.ZodType<VttgDocsChannel> =
  z.enum(VTTG_DOCS_CHANNELS);

/** Схема query роутов документации: канал необязателен, по умолчанию релиз. */
export const vttgDocsChannelQuerySchema = z.object({
  channel: vttgDocsChannelSchema.default(VTTG_DOCS_DEFAULT_CHANNEL),
});

/** Схема slug группы или страницы. */
export const vttgDocsSlugSchema = z.string().regex(VTTG_DOCS_SLUG_PATTERN);

/** Схема имени роли, которой открывают dev-канал. */
export const vttgDocsRoleSchema = z
  .string()
  .max(VTTG_DOCS_ROLE_MAX_LENGTH)
  .regex(VTTG_DOCS_ROLE_PATTERN);

/**
 * Схема настройки раздела. Одна на обе стороны: сервер проверяет ей файл из
 * хранилища, клиент — ответ API админки.
 */
export const vttgDocsSettingsSchema: z.ZodType<VttgDocsSettings> = z.object({
  devChannelRoles: z.array(z.string()),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
});

/** Схема тела запроса админки: роли без повторов. */
export const vttgDocsSettingsUpdateSchema: z.ZodType<VttgDocsSettingsUpdate> =
  z.object({
    devChannelRoles: z
      .array(vttgDocsRoleSchema)
      .max(VTTG_DOCS_DEV_ROLES_MAX_COUNT)
      .transform((roles) => uniq(roles)),
  });

/**
 * Query канала для адреса раздела: у релиза его нет — ссылки релизных доков
 * остаются чистыми.
 *
 * @param channel канал документации
 */
export function getVttgDocsChannelQuery(
  channel: VttgDocsChannel,
): Record<string, string> {
  return channel === VTTG_DOCS_DEFAULT_CHANNEL ? {} : { channel };
}

/**
 * Канал ветки разработки — его доки не для всех и не для поисковиков.
 *
 * @param channel канал документации
 */
export function isVttgDocsDevChannel(channel: VttgDocsChannel): boolean {
  return channel === VTTG_DOCS_DEV_CHANNEL;
}

/**
 * Адрес оглавления канала для роутера.
 *
 * @param channel канал документации
 */
export function getVttgDocsIndexRoute(channel: VttgDocsChannel): VttgDocsRoute {
  return { path: VTTG_DOCS_ROUTE, query: getVttgDocsChannelQuery(channel) };
}

/**
 * Адрес страницы раздела для роутера.
 *
 * @param channel канал документации
 * @param pageLink группа и страница
 */
export function getVttgDocsPageRoute(
  channel: VttgDocsChannel,
  pageLink: Pick<VttgDocsPageLink, 'groupSlug' | 'pageSlug'>,
): VttgDocsRoute {
  return {
    path: `${VTTG_DOCS_ROUTE}/${pageLink.groupSlug}/${pageLink.pageSlug}`,
    query: getVttgDocsChannelQuery(channel),
  };
}

/**
 * Адрес страницы раздела строкой — для ссылок внутри HTML страницы.
 *
 * @param channel канал документации
 * @param pageLink группа и страница
 */
export function getVttgDocsPagePath(
  channel: VttgDocsChannel,
  pageLink: Pick<VttgDocsPageLink, 'groupSlug' | 'pageSlug'>,
): string {
  const { path, query } = getVttgDocsPageRoute(channel, pageLink);
  const queryString = new URLSearchParams(query).toString();

  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Канал из query адреса. Неизвестное или пустое значение — релиз.
 *
 * @param queryValue значение `route.query.channel`
 */
export function parseVttgDocsChannel(queryValue: unknown): VttgDocsChannel {
  const parsedChannel = vttgDocsChannelSchema.safeParse(queryValue);

  return parsedChannel.success ? parsedChannel.data : VTTG_DOCS_DEFAULT_CHANNEL;
}
