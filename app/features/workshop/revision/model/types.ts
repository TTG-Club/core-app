import type { z } from 'zod';

import type { entityRevisionSchema, revisionOperationSchema } from './schemas';

export type RevisionOperation = z.output<typeof revisionOperationSchema>;
export type EntityRevision = z.output<typeof entityRevisionSchema>;

export interface WorkshopRevisionControl {
  enabled: boolean;
  revisions: EntityRevision[];
  selectedVersion: number | undefined;
  loading: boolean;
  selectRevision: (version: number) => Promise<void>;
}
