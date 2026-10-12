import type { ButtonProps } from '@nuxt/ui';

import { z } from 'zod';

import { VTTG_SUBSCRIPTION_HERO } from './subscription';

/** Создание платежа за подписку в subscriber-service (через прокси сайта). */
export const SUBSCRIPTION_PAYMENT_API_PATH = '/api/subscriptions/payments';

/** Согласия с офертой и на обработку ПД для аккаунтов без них (через прокси сайта). */
export const SUBSCRIPTION_CONSENTS_API_PATH = '/api/auth/consents';

/** Раздел профиля, где подтверждают почту. */
export const SUBSCRIPTION_EMAIL_VERIFICATION_ROUTE = '/user/profile/security';

/**
 * Параметры, которые платёжная форма PayAnyWay добавляет к адресу возврата на
 * страницу подписки: итог оплаты и номер платежа. После показа итога их убираем.
 */
export const SUBSCRIPTION_PAYMENT_RESULT_QUERY = 'payment';
export const SUBSCRIPTION_PAYMENT_TRANSACTION_QUERY = 'MNT_TRANSACTION_ID';

/**
 * Условия оплаты из subscriber-service: цена месяца и предел срока. Цену берём
 * отсюда, а не из кода сайта: сумму платежа всё равно считает и подписывает сервер.
 */
export const SUBSCRIPTION_PAYMENT_TERMS_API_PATH =
  '/api/subscriptions/payments/terms';

/**
 * Срок одной оплаты: от месяца без верхнего предела (в subscriber-service
 * `PAYANYWAY_MAX_MONTHS=0`). Быстрые варианты — кнопки над полем срока.
 */
export const SUBSCRIPTION_PAYMENT_MONTHS = {
  min: 1,
  default: 1,
  presets: [1, 3, 6, 12],
} as const;

/** Почта для чека: та же проверка, что у subscriber-service. */
export const subscriptionReceiptEmailSchema = z.email().max(255);

/** Формы слова «месяц» для getPlural. */
export const SUBSCRIPTION_MONTH_FORMS: [string, string, string] = [
  'месяц',
  'месяца',
  'месяцев',
];

/** Ответ на создание платежа: подписанная ссылка на платёжную форму. */
export const subscriptionPaymentSchema = z.object({
  id: z.string(),
  paymentUrl: z.url(),
  testMode: z.boolean(),
});

/** Условия оплаты: цена месяца, валюта и предел срока (`null` — без предела). */
export const subscriptionPaymentTermsSchema = z.object({
  monthPrice: z.number(),
  currency: z.string(),
  maxMonths: z.number().int().positive().nullable(),
});

export type SubscriptionPaymentTerms = z.infer<
  typeof subscriptionPaymentTermsSchema
>;

/** Кнопка на странице подписки, открывающая окно покупки (пока только для администраторов). */
export const VTTG_SUBSCRIPTION_BUY_BUTTON: ButtonProps = {
  label: 'Купить подписку',
  icon: VTTG_SUBSCRIPTION_HERO.icon,
  size: 'xl',
  color: 'primary',
};

/** Тексты окна покупки подписки. */
export const VTTG_SUBSCRIPTION_PURCHASE_TEXT = {
  title: 'Покупка подписки',
  description:
    'Подписка поддерживает развитие TTG Club и Virtual TTG Club и открывает привилегии на сайте и в виртуальном столе.',
  emailLabel: 'Почта для чека',
  emailHint: 'Сюда придёт чек об оплате.',
  emailInvalid: 'Укажите корректную почту.',
  unverifiedTitle: 'Подтвердите почту',
  unverifiedDescription:
    'Оплатить подписку можно только с подтверждённой почтой аккаунта. Откройте ссылку из письма или отправьте его заново в профиле.',
  unverifiedLink: 'Перейти к подтверждению',
  consentsTitle: 'Нужно ваше согласие',
  offerConsent: 'Принимаю условия',
  personalDataConsent:
    'Даю согласие на обработку персональных данных в соответствии с',
  privacyPolicyLink: 'политикой конфиденциальности',
  monthsLabel: 'Срок подписки',
  monthsHint: 'Можно оплатить сразу любое число месяцев.',
  totalLabel: 'К оплате',
  extendHint:
    'Если подписка уже действует, оплаченные месяцы добавятся к её сроку.',
  noRenewal:
    'Без автопродления: деньги списываются один раз, а подписка просто закончится в конце оплаченного срока.',
  offerLink: 'публичной оферты',
  refundNote: 'Оплаченный период не возвращается.',
  adminOnly: 'Оплата пока доступна только администраторам для проверки.',
  cancelLabel: 'Отмена',
  payLabel: 'Оплатить',
  termsError: 'Не удалось загрузить цену подписки. Попробуйте позже.',
  errorTitle: 'Не удалось перейти к оплате',
  errorFallback: 'Попробуйте ещё раз чуть позже.',
} as const;

/** Итог оплаты, с которым платёжная форма возвращает на страницу подписки. */
export const SUBSCRIPTION_PAYMENT_RESULTS = {
  success: {
    title: 'Оплата прошла',
    description:
      'Подписка включится, как только платёжный сервис подтвердит оплату. Обычно это занимает до минуты.',
    color: 'success',
  },
  pending: {
    title: 'Платёж обрабатывается',
    description:
      'Подписка включится, как только платёжный сервис подтвердит оплату.',
    color: 'info',
  },
  fail: {
    title: 'Оплата не прошла',
    description:
      'Деньги не списаны. Попробуйте ещё раз или выберите другой способ оплаты.',
    color: 'error',
  },
  cancel: {
    title: 'Оплата отменена',
    description: 'Деньги не списаны. Вернуться к оплате можно в любой момент.',
    color: 'warning',
  },
} as const satisfies Record<
  string,
  {
    title: string;
    description: string;
    color: 'success' | 'info' | 'warning' | 'error';
  }
>;

export type SubscriptionPaymentResult =
  keyof typeof SUBSCRIPTION_PAYMENT_RESULTS;

/**
 * Считает сумму к оплате за выбранное число месяцев по цене месяца с сервера.
 */
export function getSubscriptionPaymentTotal(
  monthPrice: number,
  months: number,
): number {
  return Math.round(monthPrice * months * 100) / 100;
}

/**
 * Подпись срока: «3 месяца».
 */
export function formatSubscriptionMonths(months: number): string {
  return `${months} ${getPlural(months, SUBSCRIPTION_MONTH_FORMS)}`;
}

/**
 * Проверяет, что значение из адреса — известный итог оплаты.
 */
export function isSubscriptionPaymentResult(
  value: string,
): value is SubscriptionPaymentResult {
  return Object.hasOwn(SUBSCRIPTION_PAYMENT_RESULTS, value);
}
