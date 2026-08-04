import type { BugReportResponse, BugReportStatusUpdatePayload } from './types';

/**
 * Возвращает копию баг-репорта с применёнными полями обновления статуса.
 *
 * @param bugReport Исходный баг-репорт.
 * @param payload Данные об обновлении статуса.
 */
export function applyBugStatusPatch(
  bugReport: BugReportResponse,
  payload: BugReportStatusUpdatePayload,
): BugReportResponse {
  return {
    ...bugReport,
    status: payload.status,
    statusUpdatedAt: payload.statusUpdatedAt,
    statusUpdatedBy: payload.statusUpdatedBy,
    statusComment: payload.statusComment,
  };
}
