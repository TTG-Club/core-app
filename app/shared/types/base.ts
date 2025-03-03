import type { z } from 'zod';
import type { tagSchema } from '~/shared/zod/base';

export type Tag = z.infer<typeof tagSchema>;

export interface SourceResponse {
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

export interface TimestampResponse {
  createdAt: string;
  updatedAt: string;
}
