import type { z } from 'zod';
import type { sourceSchema, tagSchema } from '~/shared/zod/base';

export type Tag = z.infer<typeof tagSchema>;

export type Source = z.infer<typeof sourceSchema>;

export interface Timestamp {
  createdAt: string;
  updatedAt: string;
}
