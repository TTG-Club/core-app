import type { VttgCompendiumChannel } from '#shared/consts';

import type { VttgCompendiumRebuild } from './types';

import { VTTG_COMPENDIUM_ADMIN_API_PREFIX } from '#shared/consts';

import {
  VTTG_COMPENDIUM_CHANNEL_TITLES,
  VTTG_COMPENDIUM_UPDATED_LABEL,
  VTTG_COMPENDIUM_UPDATED_SEPARATOR,
  VTTG_COMPENDIUM_VERSION_DATA_KEY_PREFIX,
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
 * Роут сайта, за которым версия канала.
 *
 * @param channel канал компендиума
 * @returns адрес чтения и подъёма версии канала
 */
export function getVttgCompendiumVersionApiUrl(
  channel: VttgCompendiumChannel,
): string {
  return `${VTTG_COMPENDIUM_ADMIN_API_PREFIX}/${channel}`;
}

/**
 * Ключ кеша версии канала: у каждого канала свой, иначе карточки делили бы
 * один ответ.
 *
 * @param channel канал компендиума
 * @returns ключ `useFetch`
 */
export function getVttgCompendiumVersionDataKey(
  channel: VttgCompendiumChannel,
): string {
  return `${VTTG_COMPENDIUM_VERSION_DATA_KEY_PREFIX}-${channel}`;
}

/**
 * Текст подтверждения подъёма версии.
 *
 * @param channel канал, версию которого поднимаем
 * @param version версия, до которой поднимаем
 * @returns описание последствий для диалога
 */
export function getVttgCompendiumConfirmDescription(
  channel: VttgCompendiumChannel,
  version: number,
): string {
  const channelTitle = VTTG_COMPENDIUM_CHANNEL_TITLES[channel];

  return `${channelTitle}: версия станет ${version}. Все приложения VTTG заново скачают этот компендиум целиком. Вернуть прежнюю версию будет нельзя.`;
}
