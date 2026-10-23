import type { AlertProps, ButtonProps } from '@nuxt/ui';

import { z } from 'zod';

import {
  VTTG_SUBSCRIPTION_HERO,
  VTTG_SUBSCRIPTION_PRICE,
} from './subscription';

/** Создание платежа за подписку в subscriber-service (через прокси сайта). */
export const SUBSCRIPTION_PAYMENT_API_PATH = '/api/subscriptions/payments';

/** Согласия с офертой и на обработку ПД для аккаунтов без них (через прокси сайта). */
export const SUBSCRIPTION_CONSENTS_API_PATH = '/api/auth/consents';

/** Раздел профиля, где подтверждают почту. */
export const SUBSCRIPTION_EMAIL_VERIFICATION_ROUTE = '/user/profile/security';

/**
 * Параметры адреса возврата с платёжной формы PayAnyWay: наш итог оплаты и
 * служебные `MNT_*` (номер счёта, операции, платежа). После показа итога их
 * убираем. Кнопка «Вернуться в магазин» иногда возвращает только `MNT_*` без
 * итога — тогда по номеру операции показываем, что платёж обрабатывается.
 */
export const SUBSCRIPTION_PAYMENT_RESULT_QUERY = 'payment';
export const SUBSCRIPTION_PAYMENT_SERVICE_QUERY_PREFIX = 'MNT_';
export const SUBSCRIPTION_PAYMENT_OPERATION_QUERY = 'MNT_OPERATION_ID';

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

/** Подписи готовых вариантов срока; остальные сроки подписываются числом месяцев. */
export const SUBSCRIPTION_PAYMENT_PRESET_LABELS: Readonly<
  Record<number, string>
> = {
  6: 'Полгода',
  12: 'Год',
};

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
  /** Ступени скидки за срок по возрастанию; сумму платежа считает сервер. */
  discounts: z
    .array(
      z.object({
        fromMonths: z.number().int().positive(),
        percent: z.number().int().min(0).max(100),
      }),
    )
    .default([]),
  /** Скрытые ступени (пасхалки): считаются как обычные, в подсказке не упоминаются. */
  hiddenDiscounts: z
    .array(
      z.object({
        fromMonths: z.number().int().positive(),
        percent: z.number().int().min(0).max(100),
      }),
    )
    .default([]),
});

export type SubscriptionPaymentDiscount =
  SubscriptionPaymentTerms['discounts'][number];

/** Скидки, по которым считается сумма: обычные и скрытые ступени. */
export type SubscriptionPaymentDiscounts = Pick<
  SubscriptionPaymentTerms,
  'discounts' | 'hiddenDiscounts'
>;

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
  inDevelopmentTitle: 'Virtual TTG Club ещё в разработке',
  inDevelopmentDescription:
    'Подписка не даёт раннего доступа к приложению: сейчас скачать его могут только участники кампании по сбору средств. Привилегии подписки в виртуальном столе заработают, когда приложение выйдет для всех, а на сайте — сразу после оплаты.',
  inDevelopmentConsent:
    'Понимаю, что приложение ещё в разработке и подписка не даёт раннего доступа к нему',
  consentsTitle: 'Нужно ваше согласие',
  offerConsent: 'Принимаю условия',
  personalDataConsent:
    'Даю согласие на обработку персональных данных в соответствии с',
  privacyPolicyLink: 'политикой конфиденциальности',
  monthsLabel: 'Срок подписки',
  monthsHint: 'Или укажите своё число месяцев.',
  discountHintPrefix: 'Скидка за срок:',
  discountHintFrom: 'от',
  monthsShort: 'мес.',
  savingLabel: 'Экономия',
  savingShort: 'выгода',
  noDiscount: 'Без скидки',
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
  totalFor: 'за',
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
 * Скидка в процентах за срок: наибольшая из обычных и скрытых ступеней, до
 * которых срок дотянул. Так же считает subscriber-service.
 */
export function getSubscriptionDiscountPercent(
  { discounts, hiddenDiscounts }: SubscriptionPaymentDiscounts,
  months: number,
): number {
  return [...discounts, ...hiddenDiscounts].reduce(
    (percent, tier) =>
      months >= tier.fromMonths ? Math.max(percent, tier.percent) : percent,
    0,
  );
}

/**
 * Сумма без скидки: цена месяца, умноженная на срок.
 */
export function getSubscriptionFullPrice(
  monthPrice: number,
  months: number,
): number {
  return Math.round(monthPrice * months * 100) / 100;
}

/**
 * Сумма к оплате со скидкой — так же, как считает subscriber-service
 * (округление до копеек).
 */
export function getSubscriptionPaymentTotal(
  monthPrice: number,
  months: number,
  discounts: SubscriptionPaymentDiscounts,
): number {
  const percent = getSubscriptionDiscountPercent(discounts, months);

  return Math.round(monthPrice * months * (100 - percent)) / 100;
}

/**
 * Сколько пользователь сэкономит за срок по сравнению с помесячной оплатой.
 */
export function getSubscriptionSaving(
  monthPrice: number,
  months: number,
  discounts: SubscriptionPaymentDiscounts,
): number {
  return (
    Math.round(
      (getSubscriptionFullPrice(monthPrice, months)
        - getSubscriptionPaymentTotal(monthPrice, months, discounts))
        * 100,
    ) / 100
  );
}

/**
 * Подпись варианта срока: «Полгода», «Год» или «3 месяца».
 */
export function formatSubscriptionPreset(months: number): string {
  return (
    SUBSCRIPTION_PAYMENT_PRESET_LABELS[months]
    ?? formatSubscriptionMonths(months)
  );
}

/**
 * Подсказка о скидках: «Скидка за срок: от 3 мес. — 3%, от 6 мес. — 6%».
 */
export function formatSubscriptionDiscountHint(
  discounts: ReadonlyArray<SubscriptionPaymentDiscount>,
): string {
  const tiers = discounts
    .map(
      (tier) =>
        `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.discountHintFrom} ${tier.fromMonths} ${VTTG_SUBSCRIPTION_PURCHASE_TEXT.monthsShort} — ${tier.percent}%`,
    )
    .join(', ');

  return `${VTTG_SUBSCRIPTION_PURCHASE_TEXT.discountHintPrefix} ${tiers}.`;
}

/** Иконки окна покупки подписки. */
export const SUBSCRIPTION_PURCHASE_ICONS = {
  unverified: 'tabler:mail-exclamation',
  email: 'tabler:mail',
  pay: 'tabler:credit-card',
  inDevelopment: 'tabler:tools',
} as const;

/**
 * Предупреждение в окне покупки: приложение ещё в разработке, и подписка не
 * даёт раннего доступа к нему. Оплата открывается только после отдельной
 * галочки с тем же смыслом.
 */
export const SUBSCRIPTION_IN_DEVELOPMENT_ALERT: AlertProps = {
  title: VTTG_SUBSCRIPTION_PURCHASE_TEXT.inDevelopmentTitle,
  description: VTTG_SUBSCRIPTION_PURCHASE_TEXT.inDevelopmentDescription,
  icon: SUBSCRIPTION_PURCHASE_ICONS.inDevelopment,
  color: 'warning',
  variant: 'subtle',
};

/** Кнопка в предупреждении о неподтверждённой почте. */
export const SUBSCRIPTION_EMAIL_VERIFICATION_ACTIONS: Array<ButtonProps> = [
  {
    label: VTTG_SUBSCRIPTION_PURCHASE_TEXT.unverifiedLink,
    to: SUBSCRIPTION_EMAIL_VERIFICATION_ROUTE,
    color: 'warning',
    variant: 'outline',
  },
];

/**
 * Сумма с валютой: «330 ₽».
 */
export function formatSubscriptionPrice(amount: number): string {
  return `${amount} ${VTTG_SUBSCRIPTION_PRICE.currency}`;
}

/**
 * Подпись итога: «330 ₽ за 3 месяца».
 */
export function formatSubscriptionTotal(total: number, months: number): string {
  return `${formatSubscriptionPrice(total)} ${VTTG_SUBSCRIPTION_PURCHASE_TEXT.totalFor} ${formatSubscriptionMonths(months)}`;
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
