import type { VttgDocsChannel } from '../consts/vttg-docs';
import type {
  VttgDocsAccess,
  VttgDocsPageLink,
  VttgDocsRoute,
  VttgDocsSettings,
  VttgDocsSettingsUpdate,
} from '../types/vttg-docs';

import { uniq } from 'es-toolkit';
import { z } from 'zod';

import {
  VTTG_DOCS_CHANNEL_ROLES_MAX_COUNT,
  VTTG_DOCS_CHANNELS,
  VTTG_DOCS_DEFAULT_CHANNEL,
  VTTG_DOCS_DEV_CHANNEL,
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
 * хранилища, клиент — ответ API админки. Файл, сохранённый до появления
 * настройки релизного канала, читается как «релиз открыт всем».
 */
export const vttgDocsSettingsSchema: z.ZodType<VttgDocsSettings> = z.object({
  isReleaseChannelPublic: z.boolean().default(true),
  releaseChannelRoles: z.array(z.string()).default([]),
  devChannelRoles: z.array(z.string()),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
});

/** Схема ролей одного канала в форме: без повторов и не больше предела. */
const vttgDocsChannelRolesSchema = z
  .array(vttgDocsRoleSchema)
  .max(VTTG_DOCS_CHANNEL_ROLES_MAX_COUNT)
  .transform((roles) => uniq(roles));

/** Схема тела запроса админки. */
export const vttgDocsSettingsUpdateSchema: z.ZodType<VttgDocsSettingsUpdate> =
  z.object({
    isReleaseChannelPublic: z.boolean(),
    releaseChannelRoles: vttgDocsChannelRolesSchema,
    devChannelRoles: vttgDocsChannelRolesSchema,
  });

/** Схема ответа о доступе к разделу. */
export const vttgDocsAccessSchema: z.ZodType<VttgDocsAccess> = z.object({
  channels: z.array(vttgDocsChannelSchema),
});

/**
 * Есть ли у посетителя хотя бы одна из ролей канала.
 *
 * @param visitorRoles роли посетителя из токена
 * @param channelRoles роли, которым открыт канал
 */
function hasChannelRole(
  visitorRoles: string[],
  channelRoles: string[],
): boolean {
  return visitorRoles.some((role) => channelRoles.includes(role));
}

/**
 * Каналы документации, открытые посетителю. Администратор видит оба канала
 * всегда; релиз — всем, если он открыт всем, иначе его ролям; канал
 * разработки — только своим ролям.
 *
 * @param visitorRoles роли посетителя (пусто — без входа)
 * @param isAdmin посетитель — администратор
 * @param settings настройка раздела
 */
export function getVttgDocsVisibleChannels(
  visitorRoles: string[],
  isAdmin: boolean,
  settings: Pick<
    VttgDocsSettings,
    'isReleaseChannelPublic' | 'releaseChannelRoles' | 'devChannelRoles'
  >,
): VttgDocsChannel[] {
  if (isAdmin) {
    return [...VTTG_DOCS_CHANNELS];
  }

  const isReleaseVisible =
    settings.isReleaseChannelPublic
    || hasChannelRole(visitorRoles, settings.releaseChannelRoles);

  const isDevVisible = hasChannelRole(visitorRoles, settings.devChannelRoles);

  return VTTG_DOCS_CHANNELS.filter((channel) =>
    isVttgDocsDevChannel(channel) ? isDevVisible : isReleaseVisible,
  );
}

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
 * Адрес раздела строкой из адреса для роутера.
 *
 * @param docsRoute путь и query канала
 */
function toVttgDocsPath(docsRoute: VttgDocsRoute): string {
  const queryString = new URLSearchParams(docsRoute.query).toString();

  return queryString ? `${docsRoute.path}?${queryString}` : docsRoute.path;
}

/**
 * Адрес оглавления канала строкой — для пунктов меню сайта.
 *
 * @param channel канал документации
 */
export function getVttgDocsIndexPath(channel: VttgDocsChannel): string {
  return toVttgDocsPath(getVttgDocsIndexRoute(channel));
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
  return toVttgDocsPath(getVttgDocsPageRoute(channel, pageLink));
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
