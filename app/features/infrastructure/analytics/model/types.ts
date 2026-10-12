import type { REGISTERED_ONLINE_TYPE, VISITOR_ONLINE_TYPE } from './constants';

/**
 * Функция `ym` Яндекс.Метрики. До загрузки скрипта это очередь из кода
 * подключения: вызовы копятся в ней, и загруженный скрипт выполняет их по
 * порядку. Имена полей `a` и `l` задаёт сама Метрика, переименовать их нельзя.
 */
export interface YandexMetrikaQueue {
  (counterId: string, method: string, ...parameters: Array<unknown>): void;

  /** Вызовы, накопленные до загрузки скрипта */
  a?: Array<Array<unknown>>;

  /** Время объявления очереди в миллисекундах */
  l?: number;
}

declare global {
  interface Window {
    /** Функция Яндекс.Метрики; создаётся при автоматическом подключении счётчика */
    ym?: YandexMetrikaQueue;
  }
}

/** Имя настройки отображения → выбранное значение. */
export type OnlineDisplayPreferences = Record<string, string>;

/** Данные посетителя для собственного счётчика онлайн. */
export interface OnlineHeartbeatBody {
  key: string;
  /**
   * Настройки отображения посетителя (тема, ширина сайта) для статистики в админке.
   * Без заданных настроек поле не отправляется.
   */
  preferences?: OnlineDisplayPreferences;
  previousGuestKey?: string;
  type: typeof REGISTERED_ONLINE_TYPE | typeof VISITOR_ONLINE_TYPE;
}
