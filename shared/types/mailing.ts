/**
 * Контракт ответа инструмента рассылки промокодов: одинаково нужен серверному
 * роуту `/api/admin/mailing/send` и админской форме, которая копит из этих строк
 * таблицу «почта → код».
 */

/** Итог отправки одному получателю. */
export type MailingSendStatus = 'sent' | 'failed';

/** Строка отчёта по одному адресу. */
export interface MailingSendResult {
  /** Адрес получателя. */
  email: string;
  /** Выпущенный код; `null` — код выпустить не удалось. */
  code: string | null;
  status: MailingSendStatus;
  /** Причина ошибки — только у неудачных строк. */
  error?: string;
}

/** Ответ на отправку пачки писем. */
export interface MailingSendResponse {
  results: MailingSendResult[];
}
