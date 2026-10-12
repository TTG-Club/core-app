import { z } from 'zod';

import { adminSubscriptionPath } from './constants';

/** Что произошло с подпиской (зеркалит SubscriptionEventType из subscriber-service). */
export const ADMIN_SUBSCRIPTION_EVENT_TYPES = [
  'PURCHASE',
  'GRANT',
  'REVOKE',
  'CODE_REDEEM',
  'ACTIVATE',
] as const;

export type AdminSubscriptionEventType =
  (typeof ADMIN_SUBSCRIPTION_EVENT_TYPES)[number];

/** Событие истории подписки пользователя. */
export const adminSubscriptionEventSchema = z.object({
  id: z.string(),
  type: z.enum(ADMIN_SUBSCRIPTION_EVENT_TYPES),
  months: z.number().int().nullish(),
  expiresBefore: z.string().nullish(),
  expiresAfter: z.string().nullish(),
  actorUsername: z.string().nullish(),
  code: z.string().nullish(),
  amount: z.number().nullish(),
  createdAt: z.string().nullish(),
});

export const adminSubscriptionHistorySchema = z.array(
  adminSubscriptionEventSchema,
);

export type AdminSubscriptionEvent = z.infer<
  typeof adminSubscriptionEventSchema
>;

/** Заголовок блока истории подписки в карточке пользователя. */
export const ADMIN_SUBSCRIPTION_HISTORY_TITLE = 'История подписки';

/** Тексты блока истории подписки. */
export const ADMIN_SUBSCRIPTION_HISTORY_TEXT = {
  loading: 'Загрузка…',
  empty: 'Изменений подписки пока не было',
  loadError: 'Не удалось загрузить историю подписки',
  errorTitle: 'Ошибка',
  noSubscription: 'нет',
  expiresLabel: 'Окончание:',
  monthsSuffix: 'мес.',
  currency: '₽',
  codePrefix: 'код',
  actorPrefix: 'кто:',
} as const;

/** Подписи событий истории. */
export const ADMIN_SUBSCRIPTION_EVENT_LABELS: Record<
  AdminSubscriptionEventType,
  string
> = {
  PURCHASE: 'Оплата',
  GRANT: 'Выдана администратором',
  REVOKE: 'Отключена администратором',
  CODE_REDEEM: 'Погашен промокод',
  ACTIVATE: 'Активирована по промокоду',
};

/** Иконки событий истории. */
export const ADMIN_SUBSCRIPTION_EVENT_ICONS: Record<
  AdminSubscriptionEventType,
  string
> = {
  PURCHASE: 'tabler:credit-card',
  GRANT: 'tabler:gift',
  REVOKE: 'tabler:player-stop',
  CODE_REDEEM: 'tabler:ticket',
  ACTIVATE: 'tabler:player-play',
};

/** Цвета иконок событий истории. */
export const ADMIN_SUBSCRIPTION_EVENT_COLORS: Record<
  AdminSubscriptionEventType,
  string
> = {
  PURCHASE: 'text-success',
  GRANT: 'text-primary',
  REVOKE: 'text-error',
  CODE_REDEEM: 'text-muted',
  ACTIVATE: 'text-info',
};

/** Иконка заголовка блока истории. */
export const ADMIN_SUBSCRIPTION_HISTORY_ICON = 'tabler:history';

/**
 * Возвращает путь server-роута истории подписки пользователя.
 */
export function adminSubscriptionHistoryPath(username: string): string {
  return `${adminSubscriptionPath(username)}/history`;
}

/**
 * Ключ `useAsyncData` истории подписки: по нему блок подписки обновляет
 * историю после выдачи или отключения.
 */
export function adminSubscriptionHistoryKey(username: string): string {
  return `admin-subscription-history-${username}`;
}
