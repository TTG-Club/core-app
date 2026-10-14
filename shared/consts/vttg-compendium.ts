/**
 * Каналы компендиума VTTG. Приложение качает DEV с dev.api.ttg.club, а PROD —
 * с api.ttg.club; у каждого core-api своя база и своя версия выгрузки, поэтому
 * админка поднимает их порознь. Список общий для страницы и серверного роута.
 */
export const VTTG_COMPENDIUM_CHANNELS = ['dev', 'prod'] as const;

export type VttgCompendiumChannel = (typeof VTTG_COMPENDIUM_CHANNELS)[number];

/** Роут сайта, за которым версия канала: `/api/admin/vttg-compendium/dev`. */
export const VTTG_COMPENDIUM_ADMIN_API_PREFIX = '/api/admin/vttg-compendium';
