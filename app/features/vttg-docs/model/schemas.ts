import type {
  VttgDocsIndexResponse,
  VttgDocsPage,
  VttgDocsPageLink,
  VttgDocsPageSummary,
} from '#shared/types';

import { z } from 'zod';

import { vttgDocsChannelSchema } from '#shared/utils';

const pageSummarySchema: z.ZodType<VttgDocsPageSummary> = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
});

const pageLinkSchema: z.ZodType<VttgDocsPageLink> = z.object({
  groupSlug: z.string().min(1),
  pageSlug: z.string().min(1),
  title: z.string().min(1),
});

/** Ответ оглавления канала. */
export const vttgDocsIndexResponseSchema: z.ZodType<VttgDocsIndexResponse> =
  z.object({
    index: z
      .object({
        channel: vttgDocsChannelSchema,
        version: z.string().min(1),
        releaseDate: z.string().nullable(),
        groups: z.array(
          z.object({
            slug: z.string().min(1),
            title: z.string().min(1),
            description: z.string().nullable(),
            pages: z.array(pageSummarySchema),
          }),
        ),
      })
      .nullable(),
    channels: z.array(vttgDocsChannelSchema),
    isPublic: z.boolean(),
  });

/** Ответ страницы документации. */
export const vttgDocsPageSchema: z.ZodType<VttgDocsPage> = z.object({
  channel: vttgDocsChannelSchema,
  version: z.string().min(1),
  releaseDate: z.string().nullable(),
  group: z.object({ slug: z.string().min(1), title: z.string().min(1) }),
  page: pageSummarySchema,
  html: z.string(),
  headings: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      depth: z.number().int(),
    }),
  ),
  previous: pageLinkSchema.nullable(),
  next: pageLinkSchema.nullable(),
});
