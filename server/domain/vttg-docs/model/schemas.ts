import { z } from 'zod';

import { vttgDocsChannelSchema, vttgDocsSlugSchema } from '#shared/utils';

import { VTTG_DOCS_VERSION_PATTERN } from './constants';

/**
 * Страница в `latest.json`. Файл страницы всегда лежит по пути
 * `группа/страница.md` в папке версии — отдельным полем он не передаётся.
 */
const manifestPageSchema = z.object({
  slug: vttgDocsSlugSchema,
  title: z.string().min(1),
  description: z.string().min(1).nullish(),
});

/**
 * Оглавление канала (`latest.json`), которое пишет сборка VTTG. Контракт
 * описан в постановке для VTTG (`tmp/vttg-docs-publish-prompt.md`).
 */
export const vttgDocsManifestSchema = z.object({
  schema: z.literal(1),
  channel: vttgDocsChannelSchema,
  version: z.string().regex(VTTG_DOCS_VERSION_PATTERN),
  releaseDate: z.string().min(1).nullish(),
  groups: z.array(
    z.object({
      slug: vttgDocsSlugSchema,
      title: z.string().min(1),
      description: z.string().min(1).nullish(),
      pages: z.array(manifestPageSchema),
    }),
  ),
});

export type VttgDocsManifest = z.infer<typeof vttgDocsManifestSchema>;

export type VttgDocsManifestPage = z.infer<typeof manifestPageSchema>;

/** Параметры роута страницы: группа и страница. */
export const vttgDocsPageParamsSchema = z.object({
  group: vttgDocsSlugSchema,
  page: vttgDocsSlugSchema,
});
