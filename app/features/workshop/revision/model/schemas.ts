import { z } from 'zod';

export const revisionOperationSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'REVERT',
]);

export const entityRevisionSchema = z.object({
  id: z.number(),
  version: z.number().int().positive(),
  operation: revisionOperationSchema,
  changedBy: z.string().nullable(),
  changedAt: z.iso.datetime(),
  hash: z.string(),
});

export const entityRevisionListSchema = z.array(entityRevisionSchema);

export const entityRevisionDetailSchema = entityRevisionSchema.extend({
  entityType: z.string(),
  entityId: z.string(),
  snapshot: z.record(z.string(), z.unknown()),
});
