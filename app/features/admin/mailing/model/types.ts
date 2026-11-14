/**
 * Типы инструмента рассылки промокодов.
 * Контракт ответа сервера общий с Nitro — он живёт в `#shared/types`.
 */

import type {
  MailingSendResponse,
  MailingSendResult,
  MailingSendStatus,
} from '#shared/types';
import type {
  CodeContentFormState,
  CodeContentRequest,
} from '~admin/subscriptions/model';

export type { MailingSendResponse, MailingSendResult, MailingSendStatus };

/** Состояние формы рассылки. */
export interface MailingFormState {
  /** Тема письма (маркеры допустимы). */
  subject: string;
  /** Текст письма с маркерами `{{code}}` и `{{email}}`. */
  bodyText: string;
  /** Содержимое кода, который получит каждый адресат рассылки. */
  content: CodeContentFormState;
  /** Название рассылки — попадает в метку выпущенных кодов. */
  label: string;
  /** Сырой список адресов из поля ввода. */
  recipients: string;
}

/** Результат разбора поля с адресами. */
export interface ParsedRecipients {
  /** Корректные адреса без повторов. */
  valid: string[];
  /** Строки, не похожие на адрес. */
  invalid: string[];
  /** Сколько повторов было убрано. */
  duplicates: number;
}

/**
 * Последняя рассылка — хранится локально, чтобы пережить перезагрузку страницы.
 * Письмо хранится целиком: повтор неудачных адресов должен уйти тем же текстом,
 * даже если черновик в форме уже переписали.
 */
export interface MailingCampaign {
  /** Момент запуска рассылки (ISO). */
  startedAt: string;
  subject: string;
  bodyText: string;
  /** Содержимое кода, с которым выпускались коды рассылки. */
  content: CodeContentRequest;
  label: string;
  results: MailingSendResult[];
}

/** Строка истории: код, выпущенный рассылкой. */
export interface MailingHistoryEntry {
  id: string;
  /** Адрес, на который ушёл код (из метки). */
  email: string;
  code: string;
  /** Название рассылки из метки. */
  campaign: string | null;
  /** Что несёт код, одной строкой. */
  contentSummary: string;
  createdAt: string;
  /** Кто активировал код (null — ещё не активирован). */
  redeemedBy: string | null;
  redeemedAt: string | null;
  disabled: boolean;
}
