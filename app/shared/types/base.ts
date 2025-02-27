import type { z } from 'zod';
import type { tagSchema } from '~/shared/zod/base';

export type Tag = z.infer<typeof tagSchema>;

export interface PageHeaderSource {
  name: {
    rus: string;
    eng: string;
    short: string;
  };
  group: {
    name: string;
    label: string;
  };
}

export interface Timestamp {
  createdAt: string;
  updatedAt: string;
}
