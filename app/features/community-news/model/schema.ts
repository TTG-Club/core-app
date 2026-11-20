import type {
  CommunityNewsDetailedResponse,
  CommunityNewsRequest,
  CommunityNewsShortResponse,
} from './types';

import { z } from 'zod';

import { renderNodeSchema } from '~ui/markup';

const statusSchema = z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'INACTIVE']);

const shortResponseSchema: z.ZodType<CommunityNewsShortResponse> = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  authorName: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  previewImageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  draft: z.boolean(),
  active: z.boolean(),
  status: statusSchema,
  statusName: z.string(),
  accessibleByLink: z.boolean(),
  publishDateTime: z.string().nullable(),
});

const detailedResponseSchema: z.ZodType<CommunityNewsDetailedResponse> =
  z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    authorName: z.string().nullable(),
    sourceUrl: z.string().nullable(),
    previewImageUrl: z.string().nullable(),
    videoUrl: z.string().nullable(),
    draft: z.boolean(),
    active: z.boolean(),
    status: statusSchema,
    statusName: z.string(),
    accessibleByLink: z.boolean(),
    publishDateTime: z.string().nullable(),
    content: renderNodeSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  });

// Пустые текстовые поля бэк может отдать из /raw как null — приводим к "",
// иначе повторное сохранение упрётся в обязательность поля.
const requestSchema: z.ZodType<CommunityNewsRequest> = z.object({
  url: z.string(),
  title: z.string(),
  authorName: z
    .string()
    .nullable()
    .transform((value) => value ?? ''),
  sourceUrl: z.string().nullable(),
  previewImageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  draft: z.boolean(),
  active: z.boolean(),
  accessibleByLink: z.boolean(),
  publishDateTime: z.string().nullable(),
  content: z
    .string()
    .nullable()
    .transform((value) => value ?? ''),
});

/**
 * Проверяет список новостей сообщества (`/search`, `/search/unpublished`).
 *
 * @param payload - Ответ API
 * @returns Проверенный список
 */
export function parseCommunityNewsList(
  payload: unknown,
): CommunityNewsShortResponse[] {
  return z.array(shortResponseSchema).parse(payload);
}

/**
 * Проверяет полную новость сообщества (`GET /{url}`, `POST /preview`).
 *
 * @param payload - Ответ API
 * @returns Проверенная новость
 */
export function parseCommunityNewsDetailed(
  payload: unknown,
): CommunityNewsDetailedResponse {
  return detailedResponseSchema.parse(payload);
}

/**
 * Проверяет форму новости для правки (`GET /{url}/raw`); пустые текстовые
 * поля приводит к пустой строке.
 *
 * @param payload - Ответ API
 * @returns Проверенная форма
 */
export function parseCommunityNewsRequest(
  payload: unknown,
): CommunityNewsRequest {
  return requestSchema.parse(payload);
}
