import type { H3Event } from 'h3';
import type { z } from 'zod';

import type {
  MaintenanceGate,
  MaintenanceSettingsUpdate,
  MaintenanceSiteSettings,
} from '#shared/types';

import ms from 'ms';

import { S3Service } from '#server/domain/s3';
import { parseAuthJwtPayload } from '#server/utils/authService';
import {
  MAINTENANCE_DEFAULT_SITE_SETTINGS,
  MAINTENANCE_OPEN_GATE,
} from '#shared/consts';
import {
  maintenanceSettingsFileSchema,
  maintenanceSiteSettingsSchema,
} from '#shared/utils';
import { Role } from '~/shared/types';

import {
  MAINTENANCE_FILE_PATH_PATTERN,
  MAINTENANCE_HTML_ACCEPT,
  MAINTENANCE_PAGE_METHODS,
  MAINTENANCE_PASSTHROUGH_PREFIXES,
  MAINTENANCE_SETTINGS_INVALID_FORMAT_LOG,
  MAINTENANCE_SETTINGS_INVALID_JSON_LOG,
  MAINTENANCE_SETTINGS_READ_FAILED_LOG,
} from '../model';

/** Файл настройки: записи по сайтам (`5e24`, `5e14`). */
type MaintenanceSettingsFile = z.infer<typeof maintenanceSettingsFileSchema>;

/**
 * Ключ настройки в хранилище — рядом с настройкой фона шапки главной, в папке
 * `settings`. Один файл на оба сайта: у каждого своя запись в `sites`.
 */
const SETTINGS_KEY = 'settings/maintenance.json';

/** Имя файла настройки — хранилище требует его при записи. */
const SETTINGS_FILENAME = 'maintenance.json';

const SETTINGS_CONTENT_TYPE = 'application/json';

/** Имя кешированной функции чтения настройки; ключ кеша — сайт. */
const SETTINGS_CACHE_NAME = 'maintenance';

/**
 * Запись кеша сайта в хранилище `cache`: так Nitro раскладывает результаты
 * `defineCachedFunction` — `nitro:functions`, затем имя функции и ключ с
 * расширением `.json`.
 *
 * @param siteId сайт (`5e24`, `5e14`)
 */
function getSettingsCacheStorageKey(siteId: string): string {
  return `nitro:functions:${SETTINGS_CACHE_NAME}:${siteId}.json`;
}

/**
 * Сколько Nitro держит настройку (сек). Её читает каждый заход на любую
 * страницу этого сайта, а настройку второго сайта — его сервер. На этом
 * экземпляре кеш сбрасывается сразу после сохранения; срок ограничивает
 * устаревание, если экземпляров несколько, — включение и выключение должно
 * доходить до всех быстро.
 */
const SETTINGS_CACHE_MAX_AGE_SECONDS = ms('1m') / 1000;

/**
 * Сколько после сбоя хранилища не ходить в него снова, мс. Каждый заход на
 * страницу ждал бы таймаута клиента хранилища — пока оно лежит, сайт сразу
 * считается закрытым.
 */
const READ_FAILURE_BACKOFF_MS = ms('30s');

/**
 * До какого момента (мс) не ходить в хранилище после сбоя. Общее на процесс
 * состояние, без данных пользователя.
 */
let readFailureBackoffUntil = 0;

/**
 * Разбирает JSON файла настройки. Битый или чужой формат считается
 * отсутствующей настройкой (режим включён по умолчанию), причина уходит в лог.
 *
 * @param settingsText содержимое файла настройки
 * @returns файл настройки; `null` — разобрать не удалось
 */
function parseSettingsFile(
  settingsText: string,
): MaintenanceSettingsFile | null {
  let settingsJson: unknown;

  try {
    settingsJson = JSON.parse(settingsText);
  } catch (error) {
    consola.warn(MAINTENANCE_SETTINGS_INVALID_JSON_LOG, error);

    return null;
  }

  const parsedFile = maintenanceSettingsFileSchema.safeParse(settingsJson);

  if (!parsedFile.success) {
    consola.warn(MAINTENANCE_SETTINGS_INVALID_FORMAT_LOG);

    return null;
  }

  return parsedFile.data;
}

/**
 * Читает файл настройки прямо из хранилища, мимо кеша. Сбой хранилища
 * пробрасывается: решать, что с ним делать, должен вызывающий.
 *
 * @returns файл настройки; `null` — файла нет или он негодный
 */
async function readSettingsFile(): Promise<MaintenanceSettingsFile | null> {
  try {
    const settingsObject = await S3Service.get(SETTINGS_KEY);
    const settingsText = await settingsObject.Body?.transformToString();

    return settingsText ? parseSettingsFile(settingsText) : null;
  } catch (error) {
    // Настройки ещё нет — штатное состояние, режим включён по умолчанию.
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return null;
    }

    throw error;
  }
}

/**
 * Записывает файл настройки в хранилище.
 *
 * @param settingsFile новый файл настройки
 */
async function writeSettingsFile(
  settingsFile: MaintenanceSettingsFile,
): Promise<void> {
  await S3Service.upload({
    name: SETTINGS_FILENAME,
    path: SETTINGS_KEY,
    type: SETTINGS_CONTENT_TYPE,
    data: Buffer.from(JSON.stringify(settingsFile)),
  });
}

/**
 * Запись сайта из файла настройки. Нет записи или она негодная — действует
 * умолчание, то есть режим включён.
 *
 * @param settingsFile файл настройки; `null` — файла нет
 * @param siteId сайт (`5e24`, `5e14`)
 */
function pickSiteSettings(
  settingsFile: MaintenanceSettingsFile | null,
  siteId: string,
): MaintenanceSiteSettings {
  const parsedSettings = maintenanceSiteSettingsSchema.safeParse(
    settingsFile?.sites[siteId],
  );

  return parsedSettings.success
    ? parsedSettings.data
    : MAINTENANCE_DEFAULT_SITE_SETTINGS;
}

/**
 * Сбрасывает кеш настройки сайта: следующий запрос прочитает новую.
 *
 * @param siteId сайт (`5e24`, `5e14`)
 */
async function invalidateSettingsCache(siteId: string): Promise<void> {
  await useStorage('cache').removeItem(getSettingsCacheStorageKey(siteId));
}

/**
 * Роли посетителя из его токена.
 *
 * @param event Событие H3.
 * @returns роли; `null` — посетитель не вошёл или токен негодный
 */
async function getRequestRoles(event: H3Event): Promise<string[] | null> {
  try {
    const tokenPayload = parseAuthJwtPayload(
      await verifyJwt(getTokenFromRequest(event)),
    );

    return tokenPayload.roles;
  } catch {
    return null;
  }
}

/**
 * Настройка сайта прямо из хранилища, мимо кеша, — для формы админки. Сбой
 * хранилища пробрасывается.
 *
 * @param siteId сайт (`5e24`, `5e14`)
 */
export async function readMaintenanceSiteSettings(
  siteId: string,
): Promise<MaintenanceSiteSettings> {
  return pickSiteSettings(await readSettingsFile(), siteId);
}

/**
 * Настройка с кешем Nitro, отдельным для каждого сайта. В режиме
 * stale-while-revalidate сбой хранилища при обновлении оставляет последнее
 * прочитанное значение.
 */
const getCachedSiteSettings = defineCachedFunction(
  readMaintenanceSiteSettings,
  {
    name: SETTINGS_CACHE_NAME,
    getKey: (siteId: string) => siteId,
    maxAge: SETTINGS_CACHE_MAX_AGE_SECONDS,
  },
);

/**
 * Настройка сайта для решения о заглушке: этого — на каждый заход на
 * страницу, второго — по запросу его сервера. Никогда не падает: если
 * хранилище недоступно и прочитанного значения нет, сайт считается закрытым —
 * администраторы всё равно войдут, а посторонние не увидят сайт в непонятном
 * состоянии. После сбоя хранилище какое-то время не спрашивается вовсе.
 *
 * @param siteId сайт (`5e24`, `5e14`)
 */
export async function getMaintenanceSiteSettings(
  siteId: string,
): Promise<MaintenanceSiteSettings> {
  if (Date.now() < readFailureBackoffUntil) {
    return MAINTENANCE_DEFAULT_SITE_SETTINGS;
  }

  try {
    return await getCachedSiteSettings(siteId);
  } catch (error) {
    consola.error(MAINTENANCE_SETTINGS_READ_FAILED_LOG, error);

    readFailureBackoffUntil = Date.now() + READ_FAILURE_BACKOFF_MS;

    return MAINTENANCE_DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Сохраняет настройку сайта. Записи других сайтов в файле остаются как были.
 *
 * @param siteId сайт (`5e24`, `5e14`)
 * @param update новое состояние из формы админки
 * @param username кто сохраняет
 * @returns сохранённая настройка
 */
export async function saveMaintenanceSiteSettings(
  siteId: string,
  update: MaintenanceSettingsUpdate,
  username: string,
): Promise<MaintenanceSiteSettings> {
  const settingsFile = await readSettingsFile();

  const siteSettings: MaintenanceSiteSettings = {
    ...update,
    updatedAt: new Date().toISOString(),
    updatedBy: username,
  };

  await writeSettingsFile({
    sites: { ...settingsFile?.sites, [siteId]: siteSettings },
  });

  await invalidateSettingsCache(siteId);

  return siteSettings;
}

/**
 * Решает, показывать ли посетителю заглушку: при включённом режиме сайт
 * открыт только администраторам (роль из токена запроса).
 *
 * @param event Событие H3.
 * @param settings настройка режима этого сайта
 */
export async function resolveMaintenanceGate(
  event: H3Event,
  settings: MaintenanceSiteSettings,
): Promise<MaintenanceGate> {
  if (!settings.enabled) {
    return MAINTENANCE_OPEN_GATE;
  }

  const roles = await getRequestRoles(event);

  if (roles?.includes(Role.ADMIN)) {
    return MAINTENANCE_OPEN_GATE;
  }

  return {
    blocked: true,
    signedIn: roles !== null,
    title: settings.title,
    message: settings.message,
  };
}

/**
 * Открывает ли запрос страницу сайта — только такие режим обновления заменяет
 * заглушкой. API, сборка, файлы и служебные роуты проходят как обычно.
 *
 * @param event Событие H3.
 */
export function isMaintenancePageRequest(event: H3Event): boolean {
  if (!MAINTENANCE_PAGE_METHODS.includes(event.method)) {
    return false;
  }

  const { pathname } = getRequestURL(event);

  if (
    MAINTENANCE_PASSTHROUGH_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )
  ) {
    return false;
  }

  // Адрес с расширением — обычно файл (manifest.json, robots.txt). Но если
  // браузер открывает его как страницу, это страница.
  if (MAINTENANCE_FILE_PATH_PATTERN.test(pathname)) {
    return (getRequestHeader(event, 'accept') ?? '').includes(
      MAINTENANCE_HTML_ACCEPT,
    );
  }

  return true;
}
