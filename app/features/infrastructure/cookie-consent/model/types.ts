import type { ComputedRef } from 'vue';

import type { COOKIE_CONSENT_CHOICES } from './constants';

/** Выбор посетителя в уведомлении о cookie */
export type CookieConsentChoice = (typeof COOKIE_CONSENT_CHOICES)[number];

/** Состояние выбора cookie и действия посетителя. */
export interface UseCookieConsentReturn {
  /** Выбор в текущей версии уведомления; null — выбора нет. */
  choice: ComputedRef<CookieConsentChoice | null>;
  /** Нужно ли показывать уведомление. */
  isVisible: ComputedRef<boolean>;
  /** Разрешены ли счётчики статистики. */
  isAnalyticsAllowed: ComputedRef<boolean>;
  /** Сохраняет согласие на год. */
  acceptAll: () => void;
  /** Оставляет необходимые cookie и скрывает баннер на сутки. */
  acceptNecessary: () => void;
}
