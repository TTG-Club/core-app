/**
 * «Провал спасброска — вместо этого успех» в черновике формы: блок, которому
 * нечем платить, и пустой ключ ресурса в данных не пишутся.
 */

import type { EffectSaveOverride } from './types';

/**
 * Блок «провал в успех» для черновика: без своего счётчика и без ресурса
 * платить нечем — блока нет.
 *
 * @param saveOverride блок из формы.
 * @returns блок либо `undefined`.
 */
export function toDraftSaveOverride(
  saveOverride: EffectSaveOverride | undefined,
): EffectSaveOverride | undefined {
  const canPay =
    saveOverride?.limit !== undefined || saveOverride?.counter !== undefined;

  return canPay ? saveOverride : undefined;
}

/**
 * Ключ ресурса «провала в успех» из поля: пустой ключ стирает ресурс, а не
 * пишет пустоту. Пробелы по краям снимает нормализация при сохранении, чтобы
 * не мешать набору.
 *
 * @param enteredCounter ключ из поля.
 * @returns ключ либо `undefined`.
 */
export function toDraftSaveOverrideCounter(
  enteredCounter: string,
): string | undefined {
  return enteredCounter.trim() ? enteredCounter : undefined;
}
