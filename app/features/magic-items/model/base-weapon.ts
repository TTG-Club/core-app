/**
 * Немагическая основа магического оружия для блока свойств: «Булава распада» —
 * это булава, и её 1к6 дробящего страница показывает рядом с уроном магии.
 *
 * Публичная деталь основу не отдаёт: связанные предметы лежат только в «сыром»
 * ответе раздела, а кости оружия — в «сыром» ответе самого предмета. Поэтому
 * основа догружается отдельно и только оружию.
 */

import type { MagicItemDetailResponse } from './detail';

import { z } from 'zod';

import { parseLoadedDamageFormulaParts } from '~ui/damage-formula';

import {
  MAGIC_ITEM_API_PATH,
  MAGIC_ITEM_BASE_ITEM_API_PATH,
  MAGIC_ITEM_BASE_WEAPON_DATA_KEY,
  MAGIC_ITEM_BONUS_NONE,
  MAGIC_ITEM_RAW_PATH_SUFFIX,
} from './constants';

/** Урон немагической основы магического оружия. */
export interface MagicItemBaseWeapon {
  /** Название основы: «Булава». */
  name: string;
  /** Формула основного урона: `1к6@dmg.bludgeoning`. */
  damageFormula: string;
  /** Формула урона двуручного хвата; пустая строка — свойства нет. */
  versatileFormula: string;
}

/**
 * Итог загрузки основы. Объект, а не сам урон: обработчик `useAsyncData` обязан
 * вернуть непустое значение, иначе Nuxt может повторить запрос на клиенте, — а
 * основы у предмета может и не быть.
 */
export interface MagicItemBaseWeaponLookup {
  /** Урон основы; ключа нет — показывать нечего. */
  baseWeapon?: MagicItemBaseWeapon;
}

/** «Сырой» ответ магического предмета: нужны только связанные предметы. */
const magicItemBaseItemUrlsSchema = z
  .object({ items: z.array(z.string()).catch([]) })
  .catch({ items: [] });

/** «Сырой» ответ предмета-основы: название и части урона оружия. */
const magicItemBaseWeaponSchema = z
  .object({
    name: z.object({ rus: z.string().catch('') }).catch({ rus: '' }),
    weapon: z
      .object({ damageParts: z.unknown().optional() })
      .nullish()
      .catch(null),
  })
  .nullable()
  .catch(null);

/**
 * Слаги немагических предметов, на основе которых создан магический.
 *
 * @param magicItemRawResponse «сырой» ответ
 *   `GET /api/v2/magic-items/{url}/raw`.
 * @returns слаги связанных предметов; пусто — основы нет.
 */
export function parseMagicItemBaseItemUrls(
  magicItemRawResponse: unknown,
): Array<string> {
  return magicItemBaseItemUrlsSchema.parse(magicItemRawResponse).items;
}

/**
 * Урон основы из «сырого» ответа предмета. Основной урон оружия — первая часть
 * урона; без неё показывать нечего.
 *
 * @param baseItemRawResponse «сырой» ответ `GET /api/v2/item/{url}/raw`.
 * @returns урон основы; `undefined` — предмет не оружие или урон не задан.
 */
export function parseMagicItemBaseWeapon(
  baseItemRawResponse: unknown,
): MagicItemBaseWeapon | undefined {
  const baseItem = magicItemBaseWeaponSchema.parse(baseItemRawResponse);

  const [mainDamagePart] = parseLoadedDamageFormulaParts(
    baseItem?.weapon?.damageParts,
  );

  const damageFormula = mainDamagePart?.formula.trim();

  if (!baseItem || !damageFormula) {
    return undefined;
  }

  return {
    name: baseItem.name.rus.trim(),
    damageFormula,
    versatileFormula: mainDamagePart?.versatileFormula?.trim() ?? '',
  };
}

/**
 * Есть ли у предмета оружейные свойства: бонус к атаке или урону либо свой
 * дополнительный урон. Только таким предметам блок догружает основу — категории
 * в публичной детали нет, а запрос на каждый плащ и кольцо был бы лишним.
 *
 * @param magicItem деталь магического предмета.
 * @returns `true`, если блоку свойств нужен урон основы.
 */
export function hasMagicItemWeaponProperties(
  magicItem: MagicItemDetailResponse,
): boolean {
  const hasWeaponBonus = [
    magicItem.bonuses?.attack,
    magicItem.bonuses?.damage,
  ].some(
    (weaponBonus) =>
      weaponBonus !== undefined && weaponBonus !== MAGIC_ITEM_BONUS_NONE,
  );

  const hasExtraDamage = (magicItem.damageParts ?? []).some(
    (damagePart) => damagePart.formula.trim().length > 0,
  );

  return hasWeaponBonus || hasExtraDamage;
}

/**
 * Ключ запроса основы. Слаги основы входят в ключ: в предпросмотре мастерской
 * их меняют, не сохраняя предмет, и прежний ответ подошёл бы не тому набору.
 *
 * @param magicItemUrl слаг магического предмета.
 * @param baseItemUrls слаги основы, если они уже известны.
 * @returns ключ для `useAsyncData`.
 */
export function getMagicItemBaseWeaponDataKey(
  magicItemUrl: string,
  baseItemUrls: Array<string> | undefined,
): string {
  return [
    MAGIC_ITEM_BASE_WEAPON_DATA_KEY,
    magicItemUrl,
    ...(baseItemUrls ?? []),
  ].join('-');
}

/**
 * Загружает урон немагической основы магического предмета.
 *
 * Запросы уходят только за оружием: остальным предметам основной урон не
 * нужен. Основу берём, лишь когда связь ровно одна: за «Оружием +1» стоят три
 * десятка предметов, и назвать один урон нельзя. Отказ запроса блок не ломает —
 * строка основного урона просто не появится.
 *
 * @param magicItem деталь магического предмета.
 * @param knownBaseItemUrls слаги основы, если они уже известны (предпросмотр
 *   мастерской); без них слаги берутся из «сырого» ответа раздела.
 * @returns итог загрузки; без урона основы — предмет не оружие, основы нет, их
 *   несколько или запрос не удался.
 */
export async function fetchMagicItemBaseWeapon(
  magicItem: MagicItemDetailResponse,
  knownBaseItemUrls?: Array<string>,
): Promise<MagicItemBaseWeaponLookup> {
  if (!hasMagicItemWeaponProperties(magicItem)) {
    return {};
  }

  try {
    const baseItemUrls =
      knownBaseItemUrls
      ?? parseMagicItemBaseItemUrls(
        await $fetch<unknown>(
          `${MAGIC_ITEM_API_PATH}/${magicItem.url}/${MAGIC_ITEM_RAW_PATH_SUFFIX}`,
          { retry: 0 },
        ),
      );

    const [baseItemUrl] = baseItemUrls;

    if (baseItemUrls.length !== 1 || !baseItemUrl) {
      return {};
    }

    return {
      baseWeapon: parseMagicItemBaseWeapon(
        await $fetch<unknown>(
          `${MAGIC_ITEM_BASE_ITEM_API_PATH}/${baseItemUrl}/${MAGIC_ITEM_RAW_PATH_SUFFIX}`,
          { retry: 0 },
        ),
      ),
    };
  } catch {
    return {};
  }
}
