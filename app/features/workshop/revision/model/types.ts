import type { z } from 'zod';

import type {
  entityRevisionDetailSchema,
  entityRevisionSchema,
  revisionOperationSchema,
} from './schemas';

export type RevisionOperation = z.output<typeof revisionOperationSchema>;
export type EntityRevision = z.output<typeof entityRevisionSchema>;
export type EntityRevisionDetail = z.output<typeof entityRevisionDetailSchema>;

export interface WorkshopRevisionControl {
  enabled: boolean;
  revisions: EntityRevision[];
  selectedVersion: number | undefined;
  loading: boolean;
  selectRevision: (version: number) => Promise<void>;
}
