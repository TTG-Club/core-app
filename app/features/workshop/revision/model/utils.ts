import type { EntityRevision } from './types';

import { useDateFormat } from '@vueuse/core';

import { REVISION_DATE_FORMAT, REVISION_OPERATION_LABELS } from './constants';

/**
 * Формирует понятную подпись ревизии для селектора.
 */
export function formatRevisionLabel(revision: EntityRevision): string {
  const changedAt = useDateFormat(
    revision.changedAt,
    REVISION_DATE_FORMAT,
  ).value;

  const changedBy = revision.changedBy ? ` · ${revision.changedBy}` : '';

  return `v${revision.version} · ${REVISION_OPERATION_LABELS[revision.operation]} · ${changedAt}${changedBy}`;
}
