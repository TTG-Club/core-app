/**
 * Извлекает текст нотификации из API-ответа.
 * API может вернуть text как строку, массив строк или null.
 */
export function extractNotificationText(rawText: unknown): string {
  if (Array.isArray(rawText)) {
    return String(rawText[0] ?? '');
  }

  if (typeof rawText === 'string') {
    return rawText;
  }

  return String(rawText ?? '');
}

/**
 * Парсит строку даты-времени формата `YYYY-MM-DDTHH:mm:ss` на отдельные части.
 * Возвращает объект с датой и временем (в формате `HH:mm`).
 */
export function parseDateTimeField(
  dateTimeString: string | null | undefined,
  defaultTime: string = '00:01',
): { date: string | undefined; time: string } {
  if (!dateTimeString) {
    return { date: undefined, time: defaultTime };
  }

  const parts = dateTimeString.split('T');
  const datePart = parts[0];
  const timePart = parts[1];

  return {
    date: datePart,
    time: timePart ? timePart.slice(0, 5) : defaultTime,
  };
}
