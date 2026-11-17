/**
 * Сколько мест сейчас показывают каждый открытый лист. Один лист может
 * стоять сразу в панели списка и в дровере: его состояние общее и живёт,
 * пока лист открыт хотя бы в одном месте. Счёт ведётся только на клиенте:
 * на сервере переменная модуля общая для всех запросов, и листы одного
 * посетителя не должны считаться открытыми у другого.
 */
const sessionHolders = new Map<string, number>();

/**
 * Отмечает, что лист открыли ещё в одном месте.
 * @param sheetKey - ключ открытого листа
 * @returns true, если до этого лист нигде открыт не был
 */
export function acquireSheetSession(sheetKey: string): boolean {
  if (import.meta.server) {
    return true;
  }

  const holders = sessionHolders.get(sheetKey) ?? 0;

  sessionHolders.set(sheetKey, holders + 1);

  return holders === 0;
}

/**
 * Отмечает, что лист закрыли в одном из мест.
 * @param sheetKey - ключ открытого листа
 * @returns true, если лист больше нигде не открыт
 */
export function releaseSheetSession(sheetKey: string): boolean {
  if (import.meta.server) {
    return true;
  }

  const holders = (sessionHolders.get(sheetKey) ?? 0) - 1;

  if (holders > 0) {
    sessionHolders.set(sheetKey, holders);

    return false;
  }

  sessionHolders.delete(sheetKey);

  return true;
}

/**
 * Открыт ли лист сейчас хоть где-нибудь.
 * @param sheetKey - ключ открытого листа
 */
export function isSheetSessionOpen(sheetKey: string): boolean {
  return sessionHolders.has(sheetKey);
}
