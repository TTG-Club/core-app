/** Настройки всех внешних сервисов сайта разом. */
export function getSecrets() {
  return {
    s3: getS3Secrets(),
    api: getApiSecrets(),
    auth: getAuthSecrets(),
    subscriber: getSubscriberSecrets(),
    bugReport: getBugReportSecrets(),
    comments: getCommentsSecrets(),
    findGame: getFindGameSecrets(),
  };
}

interface AuthSecrets {
  secret: string;
  url: string;
}

/** Настройки хранилища S3: без любой из переменных загрузка не работает. */
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

/** Настройки core-api: адрес и токены межсервисного доступа. */
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
 * Возвращает настройки сервиса поиска игр (find-game-api).
 *
 * Это отдельный сервис со своим адресом: общий прокси `/api/**` уводит
 * незнакомые пути в core-api, поэтому у поиска игр свой префикс
 * (`FIND_GAME_API_PREFIX`) и своя переменная `NITRO_FIND_GAME_API_URL`.
 * Сервис принимает тот же SSO-JWT пользователя, что и core-api, поэтому
 * достаточно базового URL — токен прокидывается обычным прокси-механизмом.
 *
 * Как и у остальных внешних сервисов, отсутствие переменной — ошибка
 * конфигурации: молчаливый откат на core-api дал бы 404 на каждом запросе
 * раздела, и причину пришлось бы искать в чужих логах.
 */
export function getFindGameSecrets() {
  const { NITRO_FIND_GAME_API_URL: url = '' } = process.env;

  if (!url) {
    throw new Error('[FIND-GAME] Variables are not set');
  }

  return {
    url: url.replace(/\/+$/, ''),
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

/** Настройки SMTP для исходящей почты сайта. */
export interface MailSecrets {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  /** Значение заголовка From целиком, например `"TTG Club" <support@ttg.club>`. */
  from: string;
  /** Адрес отправителя без имени — идёт в конверт письма (проверка SPF). */
  senderAddress: string;
  /** Адрес для ответов; совпадает с адресом отправителя. */
  replyTo: string;
}

/**
 * Порт неявного TLS: соединение шифруется сразу, без STARTTLS. Он же порт по
 * умолчанию, если `SPRING_MAIL_PORT` не задан.
 */
const IMPLICIT_TLS_PORT = 465;

/**
 * Достаёт «голый» адрес из значения заголовка From: `"TTG" <a@b.ru>` → `a@b.ru`.
 * Нужен для конверта письма и Reply-To — там имя отправителя недопустимо.
 *
 * @param from значение заголовка From
 * @param fallback адрес, если в строке нет угловых скобок
 */
function extractEmailAddress(from: string, fallback: string): string {
  const match = /<([^>]+)>/.exec(from);

  return match?.[1]?.trim() || (from.includes('@') ? from.trim() : fallback);
}

/**
 * Возвращает настройки SMTP или `null`, если почта не сконфигурирована.
 *
 * Имена переменных намеренно те же, что у auth-service (`SPRING_MAIL_*`,
 * `APP_MAIL_FROM`): почта одна на все сервисы, и в Dokploy её настройки
 * подставляются из общего окружения одним и тем же набором переменных.
 *
 * В отличие от остальных секретов не бросает исключение: почта нужна только
 * инструменту рассылки, и её отсутствие не должно ронять весь сервер —
 * вызывающий код отвечает понятной ошибкой «SMTP не настроен».
 */
export function getMailSecrets(): MailSecrets | null {
  const {
    SPRING_MAIL_HOST: host = '',
    SPRING_MAIL_PORT: port = '',
    SPRING_MAIL_SSL_ENABLE: sslEnable = '',
    SPRING_MAIL_USERNAME: user = '',
    SPRING_MAIL_PASSWORD: password = '',
    APP_MAIL_FROM: from = '',
  } = process.env;

  if (!host || !user || !password) {
    return null;
  }

  const parsedPort = Number.parseInt(port, 10);

  const resolvedPort = Number.isFinite(parsedPort)
    ? parsedPort
    : IMPLICIT_TLS_PORT;

  const resolvedFrom = from || user;
  const senderAddress = extractEmailAddress(resolvedFrom, user);

  return {
    host,
    port: resolvedPort,
    // Как в auth-service: значение переменной решает, а если её нет — шифруем
    // сразу только на 465, на остальных портах TLS поднимается через STARTTLS.
    secure: sslEnable
      ? sslEnable === 'true'
      : resolvedPort === IMPLICIT_TLS_PORT,
    user,
    password,
    from: resolvedFrom,
    senderAddress,
    replyTo: senderAddress,
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
