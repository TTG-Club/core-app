import type { ComputedRef } from 'vue';

/** Состояние информационного уведомления о cookie. */
export interface UseCookieNoticeReturn {
  /** Нужно ли показывать уведомление. */
  isVisible: ComputedRef<boolean>;
  /** Скрывает уведомление на год. */
  dismiss: () => void;
}
