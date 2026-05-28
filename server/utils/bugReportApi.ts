import { getBugReportSecrets } from './secrets';

/** Базовый URL внешнего микросервиса баг-репортов */
export const BUG_REPORT_EXTERNAL_API_BASE_URL = getBugReportSecrets().url;
