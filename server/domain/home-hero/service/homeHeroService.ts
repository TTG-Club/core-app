import type { S3UploadFile } from '#server/domain/s3';
import type { HomeHeroMediaKind, HomeHeroSettings } from '#shared/types';

import ms from 'ms';

import { S3Service } from '#server/domain/s3';
import { homeHeroSettingsSchema } from '#shared/utils';

import {
  HOME_HERO_EMPTY_SETTINGS,
  HOME_HERO_MEDIA_REMOVE_FAILED_LOG,
  HOME_HERO_SETTINGS_INVALID_FORMAT_LOG,
  HOME_HERO_SETTINGS_INVALID_JSON_LOG,
} from '../model';

/**
 * Ключ настройки в хранилище. Отдельная папка `settings`, а не раздел
 * загрузок: там ключ собирается из раздела, владельца и имени файла, и
 * настройка сайта оказалась бы «файлом пользователя».
 */
const SETTINGS_KEY = 'settings/home-hero.json';

/** Имя файла настройки — хранилище требует его при записи. */
const SETTINGS_FILENAME = 'home-hero.json';

const SETTINGS_CONTENT_TYPE = 'application/json';

/** Префикс ссылки на файл хранилища — отрезается, чтобы получить ключ объекта. */
const S3_URL_PREFIX = '/s3/';

/** Имя и ключ кешированной функции чтения настройки. */
const SETTINGS_CACHE_NAME = 'home-hero';
const SETTINGS_CACHE_KEY = 'settings';

/**
 * Запись кеша в хранилище `cache`: так Nitro раскладывает результаты
 * `defineCachedFunction` — `nitro:functions`, затем имя функции и ключ с
 * расширением `.json`.
 */
const SETTINGS_CACHE_STORAGE_KEY = `nitro:functions:${SETTINGS_CACHE_NAME}:${SETTINGS_CACHE_KEY}.json`;

/**
 * Сколько Nitro держит настройку (сек). Шапку рендерит каждый заход на главную,
 * а меняют фон редко. На этом экземпляре кеш сбрасывается сразу после
 * сохранения; срок ограничивает устаревание, если экземпляров несколько.
 */
const SETTINGS_CACHE_MAX_AGE_SECONDS = ms('10m') / 1000;

/**
 * Разбирает JSON настройки. Битый или чужой формат — не повод ронять главную:
 * шапка вернётся к карте по умолчанию, а причина уйдёт в лог.
 *
 * @param settingsText содержимое файла настройки
 */
function parseSettings(settingsText: string): HomeHeroSettings {
  let settingsJson: unknown;

  try {
    settingsJson = JSON.parse(settingsText);
  } catch (error) {
    consola.warn(HOME_HERO_SETTINGS_INVALID_JSON_LOG, error);

    return HOME_HERO_EMPTY_SETTINGS;
  }

  const parsedSettings = homeHeroSettingsSchema.safeParse(settingsJson);

  if (!parsedSettings.success) {
    consola.warn(HOME_HERO_SETTINGS_INVALID_FORMAT_LOG);

    return HOME_HERO_EMPTY_SETTINGS;
  }

  return parsedSettings.data;
}

/** Читает настройку прямо из хранилища, мимо кеша. */
async function readSettings(): Promise<HomeHeroSettings> {
  try {
    const settingsObject = await S3Service.get(SETTINGS_KEY);
    const settingsText = await settingsObject.Body?.transformToString();

    return settingsText
      ? parseSettings(settingsText)
      : HOME_HERO_EMPTY_SETTINGS;
  } catch (error) {
    // Настройки ещё нет — фон по умолчанию, это штатное состояние.
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return HOME_HERO_EMPTY_SETTINGS;
    }

    throw error;
  }
}

/**
 * Записывает настройку в хранилище.
 *
 * @param settings новая настройка
 */
async function writeSettings(settings: HomeHeroSettings): Promise<void> {
  await S3Service.upload({
    name: SETTINGS_FILENAME,
    path: SETTINGS_KEY,
    type: SETTINGS_CONTENT_TYPE,
    data: Buffer.from(JSON.stringify(settings)),
  });
}

/** Сбрасывает кеш настройки: следующий рендер шапки прочитает новую. */
async function invalidateSettingsCache(): Promise<void> {
  await useStorage('cache').removeItem(SETTINGS_CACHE_STORAGE_KEY);
}

/**
 * Удаляет файл фона из хранилища. Сбой только логируется: настройка к этому
 * моменту уже сохранена, а лишний файл в хранилище не ломает главную.
 *
 * @param url ссылка на файл; пусто — удалять нечего
 */
async function removeMediaFile(url: string | undefined): Promise<void> {
  if (!url?.startsWith(S3_URL_PREFIX)) {
    return;
  }

  try {
    await S3Service.delete(url.slice(S3_URL_PREFIX.length));
  } catch (error) {
    consola.error(HOME_HERO_MEDIA_REMOVE_FAILED_LOG, error);
  }
}

/**
 * Настройка фона шапки главной с кешем Nitro — её читает каждый рендер главной.
 */
export const getHomeHeroSettings = defineCachedFunction(readSettings, {
  name: SETTINGS_CACHE_NAME,
  getKey: () => SETTINGS_CACHE_KEY,
  maxAge: SETTINGS_CACHE_MAX_AGE_SECONDS,
});

/**
 * Ставит новый фон шапки: заливает файл, сохраняет настройку и только потом
 * удаляет прежний файл — при сбое на любом шаге главная остаётся с рабочим
 * фоном.
 *
 * @param file файл, готовый к загрузке (картинка уже сжата)
 * @param kind вид фона
 * @returns сохранённая настройка
 */
export async function replaceHomeHeroMedia(
  file: S3UploadFile,
  kind: HomeHeroMediaKind,
): Promise<HomeHeroSettings> {
  const previousSettings = await readSettings();
  const uploadedFile = await S3Service.upload(file);

  const settings: HomeHeroSettings = {
    media: { url: uploadedFile.url, kind },
  };

  try {
    await writeSettings(settings);
  } catch (error) {
    // Настройка не сохранилась — залитый файл никому не нужен.
    await removeMediaFile(uploadedFile.url);

    throw error;
  }

  await invalidateSettingsCache();
  await removeMediaFile(previousSettings.media?.url);

  return settings;
}

/**
 * Возвращает шапке карту по умолчанию: удаляет настройку и файл фона.
 *
 * @returns пустая настройка
 */
export async function resetHomeHeroMedia(): Promise<HomeHeroSettings> {
  const previousSettings = await readSettings();

  await S3Service.delete(SETTINGS_KEY);
  await invalidateSettingsCache();
  await removeMediaFile(previousSettings.media?.url);

  return HOME_HERO_EMPTY_SETTINGS;
}
