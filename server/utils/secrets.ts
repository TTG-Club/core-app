export function getSecrets() {
  return {
    s3: getS3Secrets(),
    api: getApiSecrets(),
    auth: getAuthSecrets(),
    subscriber: getSubscriberSecrets(),
    bugReport: getBugReportSecrets(),
    comments: getCommentsSecrets(),
  };
}

interface AuthSecrets {
  secret: string;
  url: string;
}

// Получение секретов S3
export function getS3Secrets() {
  const {
    NITRO_S3_ENDPOINT: endpoint = '',
    NITRO_S3_REGION: region = '',
    NITRO_S3_ACCESS_KEY_ID: accessKeyId = '',
    NITRO_S3_SECRET_ACCESS_KEY: secretAccessKey = '',
    NITRO_S3_BUCKET: bucket = '',
  } = process.env;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('[S3] Variables are not set');
  }

  return {
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

// Получение секретов API
export function getApiSecrets() {
  const {
    NITRO_API_URL: url = '',
    NITRO_API_TOKEN: token = '',
    NITRO_API_SECRET: secret = '',
  } = process.env;

  if (!url || !token || !secret) {
    throw new Error('[API] Variables are not set');
  }

  return {
    url,
    token,
    secret,
  };
}

/**
 * Возвращает настройки внешнего сервиса аутентификации.
 */
export function getAuthSecrets(): AuthSecrets {
  const {
    NITRO_AUTH_API_URL: authApiUrl = '',
    NITRO_AUTH_JWT_SECRET: authJwtSecret = '',
  } = process.env;

  if (!authApiUrl || !authJwtSecret) {
    throw new Error('[AUTH] Variables are not set');
  }

  return {
    secret: authJwtSecret,
    url: authApiUrl,
  };
}

/**
 * Возвращает настройки внешнего subscriber-service (подписки, коды, награды).
 * Сервис принимает тот же SSO-JWT пользователя, что и core-api, поэтому
 * достаточно базового URL — токен прокидывается обычным прокси-механизмом.
 */
export function getSubscriberSecrets() {
  const { NITRO_SUBSCRIBER_API_URL: url = '' } = process.env;

  if (!url) {
    throw new Error('[SUBSCRIBER] Variables are not set');
  }

  return {
    url,
  };
}

/**
 * Возвращает настройки внешнего сервиса комментариев.
 * Сервис принимает тот же SSO-JWT пользователя, что и core-api, поэтому
 * публичному API достаточно базового URL — токен прокидывается обычным
 * прокси-механизмом. Межсервисный токен нужен только internal-эндпоинтам
 * (массовое скрытие/восстановление комментариев при бане) и может быть
 * не задан — тогда эти операции отвечают 503.
 */
export function getCommentsSecrets() {
  const {
    NITRO_COMMENTS_API_URL: commentsApiUrl = 'https://comments.ttg.club',
    NITRO_COMMENTS_SERVICE_TOKEN: commentsServiceToken = '',
  } = process.env;

  return {
    url: commentsApiUrl,
    serviceToken: commentsServiceToken,
  };
}

/**
 * Возвращает настройки внешнего сервиса баг-репортов.
 */
export function getBugReportSecrets() {
  const {
    NITRO_BUG_REPORT_API_URL:
      bugReportApiUrl = 'https://bug-report.api.ttg.club/api/v1/bugs',
  } = process.env;

  return {
    url: bugReportApiUrl,
  };
}
