import type {
  CatalogSpellDetail,
  Character,
  CharacterInventoryItem,
  CharacterSpell,
  FeatureDescriptionNode,
} from '../types';

import { chunk } from 'es-toolkit';

import { SPELLS_DETAIL_BASE_PATH } from '../constants';
import { parseCatalogDescription, parseCatalogSpellDetail } from '../schemas';
import {
  getInventoryItemDetailPath,
  isCustomInventoryItem,
  isCustomSpell,
} from '../utils';
import { PDF_CATALOG_REQUEST_BATCH_SIZE } from './constants';

/**
 * Описания записей каталога, дозагруженные перед сборкой PDF. Свои записи
 * (`custom:`) сюда не попадают — их описание уже лежит в документе листа.
 */
export interface CatalogDescriptions {
  /** Характеристики и описание заклинания по его слагу. */
  spells: Map<string, CatalogSpellDetail>;

  /** Описание предмета по его слагу. */
  items: Map<string, FeatureDescriptionNode[]>;
}

/**
 * Кэш дозагруженных описаний на время жизни страницы: повторный экспорт того же
 * листа (или другого листа с теми же заклинаниями) сети уже не трогает.
 */
const spellDetailCache = new Map<string, CatalogSpellDetail | null>();
const itemDescriptionCache = new Map<string, FeatureDescriptionNode[]>();

/**
 * Загрузка одного ответа каталога. Отказ не роняет экспорт: без описания запись
 * просто не попадёт в справочник, а лист скачается.
 *
 * @param path путь детали.
 * @returns сырой ответ или null при любой ошибке запроса.
 */
async function fetchCatalogDetail(path: string): Promise<unknown> {
  try {
    return await $fetch<unknown>(path);
  } catch {
    return null;
  }
}

/**
 * Обход списка запросами пачками. Ограничение нужно, чтобы книга заклинаний на
 * пять десятков записей не открывала пять десятков соединений разом.
 *
 * @param values значения для обработки.
 * @param handle обработчик одного значения.
 */
async function processInBatches<T>(
  values: T[],
  handle: (value: T) => Promise<void>,
): Promise<void> {
  for (const batch of chunk(values, PDF_CATALOG_REQUEST_BATCH_SIZE)) {
    await Promise.all(batch.map((value) => handle(value)));
  }
}

/**
 * Слаги каталожных заклинаний книги, которых ещё нет в кэше.
 *
 * @param spells заклинания книги персонажа.
 * @returns слаги для дозагрузки.
 */
function getPendingSpellUrls(spells: CharacterSpell[]): string[] {
  return [
    ...new Set(
      spells.filter((spell) => !isCustomSpell(spell)).map((spell) => spell.url),
    ),
  ].filter((url) => !spellDetailCache.has(url));
}

/**
 * Каталожные предметы инвентаря, которых ещё нет в кэше.
 *
 * @param inventory инвентарь персонажа.
 * @returns предметы для дозагрузки.
 */
function getPendingItems(
  inventory: CharacterInventoryItem[],
): CharacterInventoryItem[] {
  const pending = new Map<string, CharacterInventoryItem>();

  for (const item of inventory) {
    if (isCustomInventoryItem(item) || itemDescriptionCache.has(item.url)) {
      continue;
    }

    pending.set(item.url, item);
  }

  return [...pending.values()];
}

/**
 * Дозагрузка описаний каталожных заклинаний и предметов перед сборкой PDF.
 * В документе листа их нет — на сайте они приходят с сервера при открытии
 * страницы раздела, поэтому для полного справочника нужны запросы.
 *
 * Функция никогда не выбрасывает: что не загрузилось, того не будет в
 * справочнике, но сам лист соберётся.
 *
 * @param character персонаж.
 * @returns описания каталожных записей по слагам.
 */
export async function loadCatalogDescriptions(
  character: Character,
): Promise<CatalogDescriptions> {
  const pendingSpellUrls = getPendingSpellUrls(character.spells);
  const pendingItems = getPendingItems(character.inventory);

  await Promise.all([
    processInBatches(pendingSpellUrls, async (url) => {
      const response = await fetchCatalogDetail(
        `${SPELLS_DETAIL_BASE_PATH}/${url}`,
      );

      spellDetailCache.set(url, parseCatalogSpellDetail(response));
    }),

    processInBatches(pendingItems, async (item) => {
      const response = await fetchCatalogDetail(
        getInventoryItemDetailPath(item),
      );

      itemDescriptionCache.set(item.url, parseCatalogDescription(response));
    }),
  ]);

  const spells = new Map<string, CatalogSpellDetail>();

  for (const spell of character.spells) {
    const detail = spellDetailCache.get(spell.url);

    if (detail) {
      spells.set(spell.url, detail);
    }
  }

  const items = new Map<string, FeatureDescriptionNode[]>();

  for (const item of character.inventory) {
    const description = itemDescriptionCache.get(item.url);

    if (description?.length) {
      items.set(item.url, description);
    }
  }

  return { spells, items };
}
