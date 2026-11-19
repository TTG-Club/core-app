import type { H3Event } from 'h3';

import type { VttgDocsChannel } from '#shared/consts';
import type { VttgDocsSettings, VttgDocsSettingsUpdate } from '#shared/types';

import { S3Service } from '#server/domain/s3';
import { parseAuthJwtPayload } from '#server/utils/authService';
import {
  getVttgDocsVisibleChannels,
  vttgDocsSettingsSchema,
} from '#shared/utils';
import { Role } from '~/shared/types';

import {
  VTTG_DOCS_DEFAULT_SETTINGS,
  VTTG_DOCS_FALLBACK_SETTINGS,
  VTTG_DOCS_SETTINGS_CACHE_KEY,
  VTTG_DOCS_SETTINGS_CACHE_MAX_AGE_SECONDS,
  VTTG_DOCS_SETTINGS_CACHE_NAME,
  VTTG_DOCS_SETTINGS_CACHE_STORAGE_KEY,
  VTTG_DOCS_SETTINGS_CONTENT_TYPE,
  VTTG_DOCS_SETTINGS_FILENAME,
  VTTG_DOCS_SETTINGS_INVALID_LOG,
  VTTG_DOCS_SETTINGS_KEY,
  VTTG_DOCS_SETTINGS_MISSING_ERROR,
  VTTG_DOCS_SETTINGS_UNAVAILABLE_LOG,
} from '../model';

/**
 * Разбирает файл настройки. Битый файл — не повод ронять раздел: dev-канал
 * остаётся только администраторам, причина уходит в лог.
 *
 * @param settingsText содержимое файла
 */
function parseSettings(settingsText: string): VttgDocsSettings {
  try {
    return vttgDocsSettingsSchema.parse(JSON.parse(settingsText));
  } catch (error) {
    consola.warn(VTTG_DOCS_SETTINGS_INVALID_LOG, error);

    return VTTG_DOCS_DEFAULT_SETTINGS;
  }
}

/**
 * Читает настройку прямо из хранилища, мимо кеша. Нет файла — умолчание:
 * админ ещё ничего не сохранял.
 */
export async function readVttgDocsSettings(): Promise<VttgDocsSettings> {
  try {
    const settingsObject = await S3Service.get(VTTG_DOCS_SETTINGS_KEY);
    const settingsText = await settingsObject.Body?.transformToString();

    return settingsText
      ? parseSettings(settingsText)
      : VTTG_DOCS_DEFAULT_SETTINGS;
  } catch (error) {
    if (
      error instanceof Error
      && error.name === VTTG_DOCS_SETTINGS_MISSING_ERROR
    ) {
      return VTTG_DOCS_DEFAULT_SETTINGS;
    }

    throw error;
  }
}

/** Настройка с кешем Nitro — для проверки доступа на каждом запросе. */
const getCachedVttgDocsSettings = defineCachedFunction(readVttgDocsSettings, {
  name: VTTG_DOCS_SETTINGS_CACHE_NAME,
  getKey: () => VTTG_DOCS_SETTINGS_CACHE_KEY,
  maxAge: VTTG_DOCS_SETTINGS_CACHE_MAX_AGE_SECONDS,
});

/**
 * Сохраняет настройку и сбрасывает её кеш — новые права действуют сразу.
 *
 * @param settingsUpdate права из формы админки
 * @param username кто сохранил
 * @returns сохранённая настройка
 */
export async function saveVttgDocsSettings(
  settingsUpdate: VttgDocsSettingsUpdate,
  username: string,
): Promise<VttgDocsSettings> {
  const settings: VttgDocsSettings = {
    isReleaseChannelPublic: settingsUpdate.isReleaseChannelPublic,
    releaseChannelRoles: settingsUpdate.releaseChannelRoles,
    devChannelRoles: settingsUpdate.devChannelRoles,
    updatedAt: new Date().toISOString(),
    updatedBy: username,
  };

  await S3Service.upload({
    name: VTTG_DOCS_SETTINGS_FILENAME,
    path: VTTG_DOCS_SETTINGS_KEY,
    type: VTTG_DOCS_SETTINGS_CONTENT_TYPE,
    data: Buffer.from(JSON.stringify(settings)),
  });

  await useStorage('cache').removeItem(VTTG_DOCS_SETTINGS_CACHE_STORAGE_KEY);

  return settings;
}

/**
 * Настройка для проверки прав. Хранилище недоступно — раздел закрыт всем,
 * кроме администраторов.
 */
async function getAccessSettings(): Promise<VttgDocsSettings> {
  try {
    return await getCachedVttgDocsSettings();
  } catch (error) {
    consola.error(VTTG_DOCS_SETTINGS_UNAVAILABLE_LOG, error);

    return VTTG_DOCS_FALLBACK_SETTINGS;
  }
}

/**
 * Роли посетителя из токена запроса. Нет токена, он истёк или битый — ролей
 * нет: посетитель считается гостем.
 *
 * @param event запрос к сайту
 */
async function getRequestRoles(event: H3Event): Promise<string[]> {
  try {
    const tokenPayload = parseAuthJwtPayload(
      await verifyJwt(getTokenFromRequest(event)),
    );

    return tokenPayload.roles;
  } catch {
    return [];
  }
}

/**
 * Каналы документации, которые видит посетитель: администратор — оба,
 * остальные — по настройке раздела в админке.
 *
 * @param event запрос к сайту
 */
export async function getVttgDocsChannels(
  event: H3Event,
): Promise<VttgDocsChannel[]> {
  const roles = await getRequestRoles(event);
  const isAdmin = roles.includes(Role.ADMIN);

  // Администратору настройка не нужна — не читаем её лишний раз.
  if (isAdmin) {
    return getVttgDocsVisibleChannels(
      roles,
      isAdmin,
      VTTG_DOCS_DEFAULT_SETTINGS,
    );
  }

  return getVttgDocsVisibleChannels(roles, isAdmin, await getAccessSettings());
}

/**
 * Канал открыт всем, в том числе без входа, — его страницы можно показывать
 * поисковикам.
 *
 * @param channel канал документации
 */
export async function isVttgDocsChannelPublic(
  channel: VttgDocsChannel,
): Promise<boolean> {
  return getVttgDocsVisibleChannels(
    [],
    false,
    await getAccessSettings(),
  ).includes(channel);
}
