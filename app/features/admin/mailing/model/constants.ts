import type {
  MailingCampaign,
  MailingFormState,
  MailingSendStatus,
} from './types';

import {
  MAILING_CODE_PLACEHOLDER,
  MAILING_EMAIL_PLACEHOLDER,
} from '#shared/consts';
import { REWARD_TIER_LABELS, REWARD_TIERS } from '~admin/subscriptions/model';

/**
 * Маркеры письма переэкспортируем: форма, превью и подсказки берут их отсюда,
 * а единственное определение остаётся общим с сервером.
 */
export { MAILING_CODE_PLACEHOLDER, MAILING_EMAIL_PLACEHOLDER };

/** Роут инструмента рассылки. */
export const MAILING_ROUTE = '/admin/mailing';

/** Заголовок и описание раздела (шапка страницы, карточка дашборда, навигация). */
export const MAILING_PAGE_TITLE = 'Рассылка кодов';

export const MAILING_PAGE_DESCRIPTION =
  'Массовая выдача промокодов письмами: свой код на каждый адрес';

export const MAILING_NAVIGATION_ICON = 'tabler:mail';

/** Эндпоинт отправки пачки писем (создаёт коды и шлёт письма). */
export const MAILING_SEND_API_PATH = '/api/admin/mailing/send';

/** Эндпоинт пробного письма (реальный код не выпускается). */
export const MAILING_TEST_API_PATH = '/api/admin/mailing/test';

/** Ключ кеша списка кодов, из которого строится история рассылок. */
export const MAILING_HISTORY_DATA_KEY = 'admin-mailing-history';

/** Черновик письма — переживает перезагрузку страницы. */
export const MAILING_DRAFT_STORAGE_KEY = 'admin:mailing-draft';

/** Результаты последней рассылки — чтобы случайный F5 не стёр таблицу «почта → код». */
export const MAILING_CAMPAIGN_STORAGE_KEY = 'admin:mailing-campaign';

/** Формат даты в истории и отчёте. */
export const MAILING_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

/** Тема письма по умолчанию. */
export const MAILING_DEFAULT_SUBJECT = 'Ваш промокод TTG Club';

/**
 * Текст письма по умолчанию. Короткий, без рекламных оборотов и лишних ссылок —
 * такие письма реже попадают под спам-фильтры.
 */
export const MAILING_DEFAULT_BODY = `Привет!

Спасибо за поддержку TTG Club. Вот ваш персональный промокод:

${MAILING_CODE_PLACEHOLDER}

Активировать его можно в личном кабинете на сайте — раздел «Подписки / Коды».
Код одноразовый: он привяжется к тому аккаунту, в котором его активируют.

Если что-то не сработает, просто ответьте на это письмо — поможем.`;

/** Опции селектора тира: в рассылке тир обязателен, варианта «без тира» нет. */
export const MAILING_TIER_OPTIONS = REWARD_TIERS.map((tier) => ({
  label: REWARD_TIER_LABELS[tier],
  value: tier,
}));

/** Подписи статусов строк отчёта. */
export const MAILING_STATUS_LABELS: Record<MailingSendStatus, string> = {
  sent: 'Отправлено',
  failed: 'Ошибка',
};

/** Цвета статусов строк отчёта. */
export const MAILING_STATUS_COLORS: Record<
  MailingSendStatus,
  'success' | 'error'
> = {
  sent: 'success',
  failed: 'error',
};

/** Тир по умолчанию в форме. */
const MAILING_DEFAULT_TIER = 'TIER_1';

/** Начальное состояние формы рассылки. */
export function getInitialMailingForm(): MailingFormState {
  return {
    subject: MAILING_DEFAULT_SUBJECT,
    bodyText: MAILING_DEFAULT_BODY,
    rewardTier: MAILING_DEFAULT_TIER,
    label: '',
    recipients: '',
  };
}

/**
 * Пустая кампания — состояние «рассылок ещё не было».
 * Хранится вместо `null`, чтобы не заводить свой сериализатор для localStorage.
 */
export function getEmptyMailingCampaign(): MailingCampaign {
  return {
    startedAt: '',
    subject: '',
    bodyText: '',
    rewardTier: MAILING_DEFAULT_TIER,
    label: '',
    results: [],
  };
}
