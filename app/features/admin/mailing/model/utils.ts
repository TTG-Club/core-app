import type { RedemptionCodeResponse } from '~admin/subscriptions/model';

import type {
  MailingHistoryEntry,
  MailingSendResult,
  ParsedRecipients,
} from './types';

import {
  extractMailingCampaign,
  extractMailingEmail,
  isEmailAddress,
} from '#shared/utils';

import { MAILING_STATUS_LABELS } from './constants';

/** Разделители адресов в поле ввода: запятая, точка с запятой, перенос строки, пробел. */
const RECIPIENTS_SEPARATOR = /[\s,;]+/;

/** Разделитель колонок при копировании отчёта — вставляется в таблицу как есть. */
const REPORT_COLUMN_SEPARATOR = '\t';

/** Заголовок отчёта. */
const REPORT_HEADERS = ['Почта', 'Код', 'Статус'] as const;

/**
 * Разбирает поле с адресами: убирает повторы и отделяет непохожие на адрес
 * строки, чтобы показать их администратору до отправки.
 *
 * @param source содержимое поля ввода
 */
export function parseMailingRecipients(source: string): ParsedRecipients {
  const parts = source
    .split(RECIPIENTS_SEPARATOR)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  let duplicates = 0;

  for (const part of parts) {
    if (!isEmailAddress(part)) {
      invalid.push(part);

      continue;
    }

    if (seen.has(part)) {
      duplicates += 1;

      continue;
    }

    seen.add(part);
    valid.push(part);
  }

  return { valid, invalid, duplicates };
}

/**
 * Превращает список выпущенных кодов в историю рассылок: берёт только коды с
 * адресом получателя в метке.
 *
 * @param codes все выпущенные коды из subscriber-service
 */
export function getMailingHistory(
  codes: RedemptionCodeResponse[],
): MailingHistoryEntry[] {
  return codes.reduce<MailingHistoryEntry[]>((history, code) => {
    const email = extractMailingEmail(code.label);

    if (!email) {
      return history;
    }

    history.push({
      id: code.id,
      email,
      code: code.code,
      campaign: extractMailingCampaign(code.label),
      rewardTier: code.rewardTier,
      createdAt: code.createdAt,
      redeemedBy: code.redeemedBy,
      redeemedAt: code.redeemedAt,
      disabled: code.disabled,
    });

    return history;
  }, []);
}

/**
 * Собирает отчёт «почта → код» для копирования: колонки разделены табуляцией,
 * поэтому вставка попадает в таблицу готовыми ячейками.
 *
 * @param results строки отчёта
 */
export function getMailingReportText(results: MailingSendResult[]): string {
  const rows = results.map((result) =>
    [
      result.email,
      result.code ?? '',
      MAILING_STATUS_LABELS[result.status],
    ].join(REPORT_COLUMN_SEPARATOR),
  );

  return [REPORT_HEADERS.join(REPORT_COLUMN_SEPARATOR), ...rows].join('\n');
}
