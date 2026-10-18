import type { SubscriptionSalesSettings } from '#shared/types';

import ms from 'ms';

import { S3Service } from '#server/domain/s3';
import { subscriptionSalesSettingsSchema } from '#shared/utils';

import {
  SUBSCRIPTION_SALES_DEFAULT_SETTINGS,
  SUBSCRIPTION_SALES_INVALID_FORMAT_LOG,
  SUBSCRIPTION_SALES_INVALID_JSON_LOG,
} from '../model';

/**
 * Ключ настройки в хранилище — рядом с другими настройками сайта в папке
 * `settings`, вне разделов пользовательских загрузок.
 */
const SETTINGS_KEY = 'settings/subscription-sales.json';

/** Имя файла настройки — хранилище требует его при записи. */
const SETTINGS_FILENAME = 'subscription-sales.json';

const SETTINGS_CONTENT_TYPE = 'application/json';

/** Имя и ключ кешированной функции чтения настройки. */
const SETTINGS_CACHE_NAME = 'subscription-sales';
const SETTINGS_CACHE_KEY = 'settings';

/**
 * Запись кеша в хранилище `cache`: так Nitro раскладывает результаты
 * `defineCachedFunction` — `nitro:functions`, затем имя функции и ключ с
 * расширением `.json`.
 */
const SETTINGS_CACHE_STORAGE_KEY = `nitro:functions:${SETTINGS_CACHE_NAME}:${SETTINGS_CACHE_KEY}.json`;

/**
 * Сколько Nitro держит настройку (сек). На этом экземпляре кеш сбрасывается
 * сразу после сохранения; короткий срок нужен, чтобы выключение оплаты быстро
 * дошло и до других экземпляров.
 */
const SETTINGS_CACHE_MAX_AGE_SECONDS = ms('30s') / 1000;

/**
 * Разбирает JSON настройки. Битый или чужой формат не ломает страницы — оплата
 * остаётся в состоянии по умолчанию, а причина уходит в лог.
 *
 * @param settingsText содержимое файла настройки
 */
function parseSettings(settingsText: string): SubscriptionSalesSettings {
  let settingsJson: unknown;

  try {
    settingsJson = JSON.parse(settingsText);
  } catch (error) {
    consola.warn(SUBSCRIPTION_SALES_INVALID_JSON_LOG, error);

    return SUBSCRIPTION_SALES_DEFAULT_SETTINGS;
  }

  const parsedSettings =
    subscriptionSalesSettingsSchema.safeParse(settingsJson);

  if (!parsedSettings.success) {
    consola.warn(SUBSCRIPTION_SALES_INVALID_FORMAT_LOG);

    return SUBSCRIPTION_SALES_DEFAULT_SETTINGS;
  }

  return parsedSettings.data;
}

/** Читает настройку прямо из хранилища, мимо кеша. */
async function readSettings(): Promise<SubscriptionSalesSettings> {
  try {
    const settingsObject = await S3Service.get(SETTINGS_KEY);
    const settingsText = await settingsObject.Body?.transformToString();

    return settingsText
      ? parseSettings(settingsText)
      : SUBSCRIPTION_SALES_DEFAULT_SETTINGS;
  } catch (error) {
    // Оплату ещё ни разу не выключали — это штатное состояние.
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return SUBSCRIPTION_SALES_DEFAULT_SETTINGS;
    }

    throw error;
  }
}

/**
 * Настройка продажи подписки с кешем Nitro — её читают кнопка покупки и
 * создание платежа.
 */
export const getSubscriptionSalesSettings = defineCachedFunction(readSettings, {
  name: SETTINGS_CACHE_NAME,
  getKey: () => SETTINGS_CACHE_KEY,
  maxAge: SETTINGS_CACHE_MAX_AGE_SECONDS,
});

/**
 * Сохраняет настройку и сбрасывает кеш: следующий запрос прочитает новую.
 *
 * @param settings новая настройка
 * @returns сохранённая настройка
 */
export async function setSubscriptionSalesSettings(
  settings: SubscriptionSalesSettings,
): Promise<SubscriptionSalesSettings> {
  await S3Service.upload({
    name: SETTINGS_FILENAME,
    path: SETTINGS_KEY,
    type: SETTINGS_CONTENT_TYPE,
    data: Buffer.from(JSON.stringify(settings)),
  });

  await useStorage('cache').removeItem(SETTINGS_CACHE_STORAGE_KEY);

  return settings;
}
