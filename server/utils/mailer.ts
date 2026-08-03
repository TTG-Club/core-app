import type { H3Event } from 'h3';

import type { MailSecrets } from './secrets';

import { StatusCodes } from 'http-status-codes';
import { createTransport } from 'nodemailer';

import { Role } from '~/shared/types';

import { getMailSecrets } from './secrets';

/** Письмо одному получателю. */
export interface CampaignMailOptions {
  /** Адрес получателя — всегда ровно один. */
  to: string;
  subject: string;
  /** Текстовая версия письма. */
  text: string;
  /** HTML-версия письма. */
  html: string;
}

/**
 * Сообщение об отсутствующих настройках SMTP: показывается администратору
 * в инструменте рассылки, поэтому называет конкретные переменные окружения.
 */
const MAIL_NOT_CONFIGURED_MESSAGE =
  'SMTP не настроен: задайте SPRING_MAIL_HOST, SPRING_MAIL_USERNAME и SPRING_MAIL_PASSWORD';

/**
 * Создаёт транспорт с ограничением «не больше письма в секунду» и одним
 * соединением: ровный темп и переиспользование сессии SMTP выглядят для
 * почтовых провайдеров как обычная переписка, а не как всплеск рассылки.
 *
 * @param secrets настройки SMTP
 */
function createMailTransporter(secrets: MailSecrets) {
  return createTransport({
    host: secrets.host,
    port: secrets.port,
    secure: secrets.secure,
    auth: {
      user: secrets.user,
      pass: secrets.password,
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 1,
    // Заблокированный порт SMTP выглядит как «соединился и молчит»: без своих
    // таймаутов запрос рассылки висел бы минутами вместо понятной ошибки.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

/** Общий на процесс транспорт: соединение переиспользуется между запросами. */
let transporter: ReturnType<typeof createMailTransporter> | null = null;

/** Настройки, с которыми был создан текущий транспорт. */
let transporterSecrets: MailSecrets | null = null;

/**
 * Возвращает настройки SMTP или отвечает 503 с понятным текстом.
 *
 * Вызывается до выпуска кодов: если почта не настроена, рассылку нужно
 * остановить сразу, иначе коды выпустятся, а письма не уйдут.
 */
export function assertMailerConfigured(): MailSecrets {
  const secrets = getMailSecrets();

  if (!secrets) {
    throw createError(
      getErrorResponse(StatusCodes.SERVICE_UNAVAILABLE, {
        message: MAIL_NOT_CONFIGURED_MESSAGE,
      }),
    );
  }

  return secrets;
}

/**
 * Возвращает готовый транспорт. Пересоздаёт его, если настройки SMTP изменились
 * (актуально для дев-сервера с перезагрузкой окружения).
 */
function getMailTransporter(): ReturnType<typeof createMailTransporter> {
  const secrets = assertMailerConfigured();

  const isSameConfiguration =
    transporterSecrets?.host === secrets.host
    && transporterSecrets?.port === secrets.port
    && transporterSecrets?.user === secrets.user
    && transporterSecrets?.password === secrets.password
    && transporterSecrets?.secure === secrets.secure;

  if (!transporter || !isSameConfiguration) {
    transporter?.close();
    transporter = createMailTransporter(secrets);
    transporterSecrets = secrets;
  }

  return transporter;
}

/**
 * Отправляет письмо одному получателю.
 *
 * Каждому адресату уходит отдельное сообщение (никаких списков в `To` и скрытых
 * копий), с обеими частями `text` и `html`, обратным адресом на домене
 * отправителя и заголовком отписки — это базовые требования почтовых фильтров.
 *
 * @param options письмо и его получатель
 */
export async function sendCampaignMail(
  options: CampaignMailOptions,
): Promise<void> {
  const secrets = assertMailerConfigured();

  await getMailTransporter().sendMail({
    from: secrets.from,
    to: options.to,
    replyTo: secrets.replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html,
    // Адрес конверта совпадает с From — иначе проверка SPF считает письмо чужим.
    envelope: {
      from: secrets.senderAddress,
      to: options.to,
    },
    headers: {
      'List-Unsubscribe': `<mailto:${secrets.replyTo}?subject=unsubscribe>`,
    },
  });
}

/**
 * Возвращает базовый адрес сайта для ссылок в письме: из настроек, а при их
 * отсутствии — из адреса самого запроса.
 *
 * @param event событие запроса
 */
export function getMailingSiteUrl(event: H3Event): string {
  const configuredUrl = useRuntimeConfig(event).site?.url;

  if (typeof configuredUrl === 'string' && configuredUrl) {
    return configuredUrl;
  }

  return getRequestURL(event).origin;
}

/**
 * Возвращает читаемое описание ошибки отправки для строки отчёта.
 *
 * @param error перехваченная ошибка
 */
export function getMailErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Пропускает дальше только администратора.
 *
 * Отдельная проверка вместо `assertAdminAccess`: та пускает и модератора, а
 * рассылка выпускает промокоды и отправляет письма от имени сайта — это право
 * только администратора.
 *
 * @param event событие запроса
 */
export async function assertMailingAdmin(event: H3Event): Promise<void> {
  const { roles } = await getUserFromToken(event);

  if (!roles.includes(Role.ADMIN)) {
    throw createError(getErrorResponse(StatusCodes.FORBIDDEN));
  }
}
