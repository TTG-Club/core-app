import type { ButtonProps } from '@nuxt/ui';

import { z } from 'zod';

import {
  VTTG_SUBSCRIPTION_HERO,
  VTTG_SUBSCRIPTION_PRICE,
} from './subscription';

/** Создание платежа за подписку в subscriber-service (через прокси сайта). */
export const SUBSCRIPTION_PAYMENT_API_PATH = '/api/subscriptions/payments';

/**
 * Параметры, которые платёжная форма PayAnyWay добавляет к адресу возврата на
 * страницу подписки: итог оплаты и номер платежа. После показа итога их убираем.
 */
export const SUBSCRIPTION_PAYMENT_RESULT_QUERY = 'payment';
export const SUBSCRIPTION_PAYMENT_TRANSACTION_QUERY = 'MNT_TRANSACTION_ID';

/** Цена одного месяца подписки числом — для расчёта суммы за выбранный срок. */
export const SUBSCRIPTION_MONTH_PRICE = Number(VTTG_SUBSCRIPTION_PRICE.amount);

/**
 * Сколько месяцев можно оплатить за раз. Зеркало `PAYANYWAY_MAX_MONTHS` в
 * subscriber-service: поменялось там — поправить здесь.
 */
export const SUBSCRIPTION_PAYMENT_MONTHS = {
  min: 1,
  max: 12,
  default: 1,
} as const;

/** Ответ на создание платежа: подписанная ссылка на платёжную форму. */
export const subscriptionPaymentSchema = z.object({
  id: z.string(),
  paymentUrl: z.url(),
  testMode: z.boolean(),
});

/** Кнопка оплаты подписки (пока доступна только администраторам); подпись с суммой собирается в компоненте. */
export const VTTG_SUBSCRIPTION_PAY_BUTTON: ButtonProps = {
  icon: VTTG_SUBSCRIPTION_HERO.icon,
  size: 'xl',
  color: 'primary',
};

/** Подписи у кнопки оплаты. */
export const VTTG_SUBSCRIPTION_PAYMENT_TEXT = {
  payLabel: 'Оформить за',
  monthsLabel: 'Срок, мес.',
  noRenewal:
    'Без автопродления: подписка просто закончится в конце оплаченного срока.',
  offerNote: 'Нажимая «Оформить», вы принимаете условия',
  offerLink: 'публичной оферты',
  adminOnly: 'Оплата пока доступна только администраторам для проверки.',
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
 * Считает сумму к оплате за выбранное число месяцев.
 */
export function getSubscriptionPaymentTotal(months: number): number {
  return SUBSCRIPTION_MONTH_PRICE * months;
}

/**
 * Проверяет, что значение из адреса — известный итог оплаты.
 */
export function isSubscriptionPaymentResult(
  value: string,
): value is SubscriptionPaymentResult {
  return Object.hasOwn(SUBSCRIPTION_PAYMENT_RESULTS, value);
}
