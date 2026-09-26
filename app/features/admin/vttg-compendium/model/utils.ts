import type { VttgCompendiumRebuild } from './types';

import {
  VTTG_COMPENDIUM_UPDATED_LABEL,
  VTTG_COMPENDIUM_UPDATED_SEPARATOR,
  VTTG_COMPENDIUM_VERSION_STEP,
} from './constants';

/**
 * Версия, которую поле предлагает после текущей.
 *
 * @param currentVersion текущая версия компендиума
 * @returns ближайшая допустимая новая версия
 */
export function getNextVttgCompendiumVersion(currentVersion: number): number {
  return currentVersion + VTTG_COMPENDIUM_VERSION_STEP;
}

/**
 * Идёт ли пересборка выгрузки прямо сейчас.
 *
 * @param rebuild последняя пересборка
 * @returns `true`, пока бэк пересобирает выгрузку
 */
export function isVttgCompendiumRebuildRunning(
  rebuild: VttgCompendiumRebuild,
): boolean {
  return rebuild.status === 'RUNNING';
}

/**
 * Подпись с датой: «Начата 26.09.2026 16:48».
 *
 * @param label подпись перед датой
 * @param formattedDate уже отформатированная дата
 * @returns подпись и дата одной строкой
 */
export function getVttgCompendiumDatedText(
  label: string,
  formattedDate: string,
): string {
  return `${label} ${formattedDate}`;
}

/**
 * Строка «кто и когда изменил версию»; автора может не быть.
 *
 * @param formattedUpdatedAt уже отформатированная дата изменения
 * @param updatedBy логин того, кто поднял версию
 * @returns дата изменения и автор через разделитель
 */
export function getVttgCompendiumUpdatedText(
  formattedUpdatedAt: string,
  updatedBy: string | null,
): string {
  const datedText = getVttgCompendiumDatedText(
    VTTG_COMPENDIUM_UPDATED_LABEL,
    formattedUpdatedAt,
  );

  return updatedBy
    ? `${datedText}${VTTG_COMPENDIUM_UPDATED_SEPARATOR}${updatedBy}`
    : datedText;
}

/**
 * Текст подтверждения подъёма версии.
 *
 * @param version версия, до которой поднимаем
 * @returns описание последствий для диалога
 */
export function getVttgCompendiumConfirmDescription(version: number): string {
  return `Версия станет ${version}. Все приложения VTTG заново скачают компендиум целиком. Вернуть прежнюю версию будет нельзя.`;
}
