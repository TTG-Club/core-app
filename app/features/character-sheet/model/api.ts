import type {
  CatalogSpellDetail,
  Character,
  CharacterInventoryItem,
  CharacterSheetDetail,
  CharacterSheetListPage,
  FeatSpellChoiceFilter,
  FeatSummary,
  FeatureDescriptionNode,
  ItemSummary,
  MagicItemSummary,
  SavedCharacterSheet,
  SavedCharacterSheetListPage,
  SpellCatalogItem,
  SpellDamageFormulas,
  StartingEquipmentOption,
} from './types';

import { FetchError } from 'ofetch';

import {
  parseCharacterSheetDetail,
  parseCharacterSheetListPage,
  parseCharacterSheetShare,
  parseSavedCharacterSheet,
  parseSavedCharacterSheetListPage,
} from './character-schema';
import {
  CHARACTER_SHEET_API_PATH,
  CHARACTER_SHEET_SAVED_API_PATH,
  CHARACTER_SHEET_SHARED_API_PATH,
  CHOICE_SPELL_POOL_SIZE,
  FEATS_DETAIL_BASE_PATH,
  ITEMS_DETAIL_BASE_PATH,
  MAGIC_ITEMS_DETAIL_BASE_PATH,
  RAW_DETAIL_PATH_SUFFIX,
  SHEET_UNKNOWN_ERROR_MESSAGE,
  SPELLS_DETAIL_BASE_PATH,
  SPELLS_RAW_DETAIL_PATH_SUFFIX,
  SPELLS_SEARCH_PATH,
} from './constants';
import {
  parseCatalogDescription,
  parseCatalogSpellDetail,
  parseFeatDetail,
  parseItemArmor,
  parseItemDetail,
  parseItemWeapon,
  parseMagicItemRaw,
  parseSpellCatalog,
  parseSpellDamageFormulas,
} from './schemas';
import {
  buildStartingEquipmentItem,
  getInventoryItemDetailPath,
  uniqueSpellsByName,
} from './utils';

/**
 * Человекочитаемое сообщение об ошибке запроса к листам персонажей.
 * Бэк присылает русский текст в `message` — показываем его как есть.
 *
 * @param error пойманная ошибка.
 * @returns текст для тоста или плашки.
 */
export function getSheetErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    return error.data?.message || error.message || SHEET_UNKNOWN_ERROR_MESSAGE;
  }

  // Не только запросы: сборка PDF падает обычной ошибкой (не загрузился шрифт,
  // не пришёл чанк), и её текст полезнее общей заглушки.
  if (error instanceof Error) {
    return error.message || SHEET_UNKNOWN_ERROR_MESSAGE;
  }

  return SHEET_UNKNOWN_ERROR_MESSAGE;
}

/**
 * Загружает и валидирует детальную информацию о черте из каталога.
 *
 * @param featUrl URL черты в каталоге.
 * @returns разобранная черта или null, если ответ не соответствует контракту.
 */
export async function fetchFeatDetail(
  featUrl: string,
): Promise<FeatSummary | null> {
  const response = await $fetch<unknown>(
    `${FEATS_DETAIL_BASE_PATH}/${featUrl}`,
    {
      method: 'GET',
      retry: 0,
    },
  );

  return parseFeatDetail(response);
}

/**
 * Список листов текущего пользователя с серверным лимитом.
 * Bearer-токен подставляет серверный прокси из куки.
 *
 * @param includeDeleted включать ли удалённые (история восстановления).
 * @returns список листов и лимит.
 */
export async function fetchCharacterSheetList(
  includeDeleted = true,
): Promise<CharacterSheetListPage> {
  const response = await $fetch(CHARACTER_SHEET_API_PATH, {
    method: 'GET',
    query: { includeDeleted },
    retry: 0,
  });

  return parseCharacterSheetListPage(response);
}

/**
 * Полный лист персонажа по идентификатору.
 *
 * @param id идентификатор листа.
 * @returns лист с разобранным персонажем.
 */
export async function fetchCharacterSheet(
  id: string,
): Promise<CharacterSheetDetail> {
  const response = await $fetch(`${CHARACTER_SHEET_API_PATH}/${id}`, {
    method: 'GET',
    retry: 0,
  });

  return parseCharacterSheetDetail(response);
}

/**
 * Создание листа. Название дублируется из документа в отдельное поле — списку
 * и истории удалённых оно нужно без разбора jsonb на сервере.
 *
 * @param data персонаж нового листа (обычно клон `DEFAULT_CHARACTER`).
 * @returns созданный лист (id — серверный UUID).
 */
export async function createCharacterSheet(
  data: Character,
): Promise<CharacterSheetDetail> {
  const response = await $fetch(CHARACTER_SHEET_API_PATH, {
    method: 'POST',
    body: { name: data.name, data },
    retry: 0,
  });

  return parseCharacterSheetDetail(response);
}

/**
 * Сохранение листа целиком (автосохранение). Название дублируется из
 * документа, как при создании.
 *
 * @param id идентификатор листа.
 * @param data актуальный персонаж листа.
 */
export async function updateCharacterSheet(
  id: string,
  data: Character,
): Promise<void> {
  await $fetch(`${CHARACTER_SHEET_API_PATH}/${id}`, {
    method: 'PUT',
    body: { name: data.name, data },
    retry: 0,
  });
}

/**
 * Мягкое удаление листа: уходит в историю с возможностью восстановления.
 *
 * @param id идентификатор листа.
 */
export async function deleteCharacterSheet(id: string): Promise<void> {
  await $fetch(`${CHARACTER_SHEET_API_PATH}/${id}`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Восстановление листа из истории удалённых. При заполненном лимите активных
 * бэк вернёт 400 с текстом.
 *
 * @param id идентификатор листа.
 */
export async function restoreCharacterSheet(id: string): Promise<void> {
  await $fetch(`${CHARACTER_SHEET_API_PATH}/${id}/restore`, {
    method: 'POST',
    retry: 0,
  });
}

/**
 * Включение доступа по ссылке. Идемпотентно: у уже расшаренного листа бэк
 * возвращает прежний токен, поэтому разосланные ранее ссылки не ломаются.
 *
 * @param id идентификатор листа.
 * @returns токен ссылки.
 */
export async function shareCharacterSheet(id: string): Promise<string> {
  const response = await $fetch(`${CHARACTER_SHEET_API_PATH}/${id}/share`, {
    method: 'POST',
    retry: 0,
  });

  return parseCharacterSheetShare(response);
}

/**
 * Отзыв доступа по ссылке: выданная ранее ссылка перестаёт открываться.
 *
 * @param id идентификатор листа.
 */
export async function revokeCharacterSheetShare(id: string): Promise<void> {
  await $fetch(`${CHARACTER_SHEET_API_PATH}/${id}/share`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Описание каталожного предмета из его раздела: в документе листа у каталожных
 * записей описания нет, а своей копии оно нужно — редактировать пустое описание
 * игроку пришлось бы с нуля. Отказ запроса копирование не срывает: предмет
 * получит пустое описание, которое можно заполнить самому.
 *
 * @param inventoryItem каталожный предмет инвентаря.
 * @returns узлы описания; пустой массив — описание не загрузилось.
 */
export async function fetchInventoryItemDescription(
  inventoryItem: CharacterInventoryItem,
): Promise<FeatureDescriptionNode[]> {
  try {
    const response = await $fetch<unknown>(
      getInventoryItemDetailPath(inventoryItem),
      { retry: 0 },
    );

    return parseCatalogDescription(response);
  } catch {
    return [];
  }
}

/**
 * Боевые параметры предмета (доспех, оружие) из «сырого» ответа раздела:
 * публичная деталь их не отдаёт, а без чисел не посчитать ни КД, ни бонус
 * атаки. Ошибку глотаем — предмет добавится без боевых данных.
 *
 * @param itemUrl слаг предмета в каталоге.
 * @param summary разобранная деталь предмета (категория и типы — для щита).
 * @returns параметры доспеха и оружия.
 */
async function fetchItemCombatStats(
  itemUrl: string,
  summary: ItemSummary,
): Promise<Pick<ItemSummary, 'armor' | 'weapon'>> {
  try {
    const response = await $fetch<unknown>(
      `${ITEMS_DETAIL_BASE_PATH}/${itemUrl}/${RAW_DETAIL_PATH_SUFFIX}`,
      { method: 'GET', retry: 0 },
    );

    // Разбираем только профиль своей категории: редактор шлёт заготовки
    // armor/weapon даже у чужих категорий (пустые объекты), поэтому чужой
    // профиль дал бы ложные КД/атаку.
    return {
      armor:
        summary.category === 'ARMOR' ? parseItemArmor(response, summary) : null,
      weapon: summary.category === 'WEAPON' ? parseItemWeapon(response) : null,
    };
  } catch {
    return { armor: null, weapon: null };
  }
}

/**
 * Деталь предмета раздела «Предметы» вместе с боевыми параметрами доспеха и
 * оружия. Общая для модалки добавления предметов и импорта чужого листа.
 *
 * @param itemUrl слаг предмета в каталоге.
 * @returns деталь предмета; null — ответ не распознан.
 */
export async function fetchItemSummary(
  itemUrl: string,
): Promise<ItemSummary | null> {
  const response = await $fetch<unknown>(
    `${ITEMS_DETAIL_BASE_PATH}/${itemUrl}`,
    { method: 'GET', retry: 0 },
  );

  const summary = parseItemDetail(response);

  if (
    !summary
    || (summary.category !== 'ARMOR' && summary.category !== 'WEAPON')
  ) {
    return summary;
  }

  return { ...summary, ...(await fetchItemCombatStats(itemUrl, summary)) };
}

/**
 * Редкость и немагическая основа магического предмета: ни того, ни другого нет
 * ни в поиске, ни в публичной детали — связанные предметы раздел отдаёт только
 * в «сыром» ответе. Основу берём, лишь когда связь ровно одна: за «Оружием +1,
 * +2 или +3» стоят три десятка предметов, и выбрать за игрока нечего. Ошибку
 * глотаем — предмет добавится, как раньше, без цены и боевых параметров.
 *
 * @param magicItemUrl слаг магического предмета в каталоге.
 * @returns редкость с основой; null — «сырой» ответ не загрузился.
 */
export async function fetchMagicItemSummary(
  magicItemUrl: string,
): Promise<MagicItemSummary | null> {
  try {
    const response = await $fetch<unknown>(
      `${MAGIC_ITEMS_DETAIL_BASE_PATH}/${magicItemUrl}/${RAW_DETAIL_PATH_SUFFIX}`,
      { method: 'GET', retry: 0 },
    );

    const { baseItemUrls, ...summary } = parseMagicItemRaw(response);

    const [baseItemUrl] = baseItemUrls;

    if (baseItemUrls.length !== 1 || !baseItemUrl) {
      return { ...summary, baseItem: null };
    }

    // Деталь основы не загрузилась — редкость всё равно даёт цену по таблице.
    const baseItem = await fetchItemSummary(baseItemUrl).catch(() => null);

    return { ...summary, baseItem };
  } catch {
    return null;
  }
}

/**
 * Предметы инвентаря для выбранного варианта стартового снаряжения. Позиции со
 * ссылкой догружаются деталью раздела «Предметы» — иначе оружие не каталось бы
 * атакой, а доспех не считался бы в класс доспеха. Отказ запроса не срывает
 * применение класса или предыстории: такая позиция попадёт на лист одним
 * названием.
 *
 * @param option выбранный вариант стартового снаряжения.
 * @returns предметы инвентаря в порядке варианта.
 */
export async function buildStartingEquipmentItems(
  option: StartingEquipmentOption,
): Promise<CharacterInventoryItem[]> {
  const summaries = await Promise.all(
    option.items.map((item) =>
      item.url ? fetchItemSummary(item.url).catch(() => null) : null,
    ),
  );

  return option.items.map((item, index) =>
    buildStartingEquipmentItem(item, summaries[index] ?? null),
  );
}

/**
 * Характеристики и описание каталожного заклинания из раздела «Заклинания» —
 * то же, чего не хватает своей копии. Отказ запроса, как и у предмета, не
 * срывает копирование.
 *
 * @param spellUrl слаг заклинания в каталоге.
 * @returns деталь заклинания; null — не загрузилась.
 */
export async function fetchCatalogSpellDetail(
  spellUrl: string,
): Promise<CatalogSpellDetail | null> {
  try {
    const response = await $fetch<unknown>(
      `${SPELLS_DETAIL_BASE_PATH}/${spellUrl}`,
      { retry: 0 },
    );

    return parseCatalogSpellDetail(response);
  } catch {
    return null;
  }
}

/**
 * Формулы урона каталожного заклинания вместе с тирами масштабирования
 * заговора. Публичная деталь их не отдаёт — как и боевые числа предметов, они
 * лежат в «сыром» ответе раздела. Отказ запроса не ломает вкладку: заклинание
 * останется без плитки урона.
 *
 * @param spellUrl слаг заклинания в каталоге.
 * @returns урон заклинания; пустые формулы — урона нет или он не загрузился.
 */
export async function fetchSpellDamageFormulas(
  spellUrl: string,
): Promise<SpellDamageFormulas> {
  try {
    const response = await $fetch<unknown>(
      `${SPELLS_DETAIL_BASE_PATH}/${spellUrl}/${SPELLS_RAW_DETAIL_PATH_SUFFIX}`,
      { method: 'GET', retry: 0 },
    );

    return parseSpellDamageFormulas(response);
  } catch {
    return { base: [], cantripTiers: [] };
  }
}

/**
 * Лист по ссылке «поделиться»: чтение без авторизации. Неизвестный, отозванный
 * или битый токен бэк отдаёт как 404.
 *
 * @param token токен ссылки из адреса страницы.
 * @returns лист с разобранным персонажем.
 */
export async function fetchSharedCharacterSheet(
  token: string,
): Promise<CharacterSheetDetail> {
  const response = await $fetch(`${CHARACTER_SHEET_SHARED_API_PATH}/${token}`, {
    method: 'GET',
    retry: 0,
  });

  return parseCharacterSheetDetail(response);
}

/**
 * Чужие листы, сохранённые пользователем по ссылке, с серверным лимитом. Листы,
 * к которым доступ закрыт, из ответа не пропадают — приходят без документа.
 *
 * @returns список сохранённых листов и лимит.
 */
export async function fetchSavedCharacterSheets(): Promise<SavedCharacterSheetListPage> {
  const response = await $fetch(CHARACTER_SHEET_SAVED_API_PATH, {
    method: 'GET',
    retry: 0,
  });

  return parseSavedCharacterSheetListPage(response);
}

/**
 * Сохранение чужого листа по токену ссылки. Идемпотентно: у уже сохранённого
 * листа обновляется токен, второй записи не появляется.
 *
 * @param shareToken токен ссылки из присланного адреса.
 * @returns сохранённая запись.
 */
export async function saveSharedCharacterSheet(
  shareToken: string,
): Promise<SavedCharacterSheet> {
  const response = await $fetch(CHARACTER_SHEET_SAVED_API_PATH, {
    method: 'POST',
    body: { shareToken },
    retry: 0,
  });

  return parseSavedCharacterSheet(response);
}

/**
 * Текущие хиты чужого листа, сохранённого по ссылке: их отмечает мастер боя в
 * трекере инициативы. Пишется только `health.current` — максимум лист считает
 * сам, остальной документ остаётся владельца. Отозванная ссылка или удалённый
 * лист — 404.
 *
 * @param savedId идентификатор сохранённой записи.
 * @param current текущие хиты персонажа.
 */
export async function updateSavedCharacterSheetHitPoints(
  savedId: string,
  current: number,
): Promise<void> {
  await $fetch(`${CHARACTER_SHEET_SAVED_API_PATH}/${savedId}/health`, {
    method: 'PATCH',
    body: { current },
    retry: 0,
  });
}

/**
 * Удаление сохранённой ссылки. Сам лист остаётся у владельца.
 *
 * @param savedId идентификатор сохранённой записи.
 */
export async function deleteSavedCharacterSheet(
  savedId: string,
): Promise<void> {
  await $fetch(`${CHARACTER_SHEET_SAVED_API_PATH}/${savedId}`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Пул заклинаний выбора черты.
 *
 * Список собирается поиском по каталогу, а не хранится в самой черте:
 * заклинаний слишком много, и перечень устарел бы при первом же пополнении
 * справочника. Фильтр поиска повторяет ссылку из описания черты
 * (`/spells?className=wizard-phb&level=0`), поэтому пул совпадает с тем, что
 * игрок увидел бы в разделе «Заклинания».
 *
 * @param filter ограничения пула из механики черты.
 * @param classUrls классы, из списков которых идёт выбор; пусто — без сужения.
 * @returns заклинания пула; null — запрос не удался. Сбой отличается от пустого
 *   пула нарочно: пустой пул снимает требование выбора, а сбой — нет, иначе
 *   игрок прошёл бы шаг без заклинания, которое ему положено.
 */
export async function fetchChoiceSpells(
  filter: FeatSpellChoiceFilter,
  classUrls: string[],
): Promise<SpellCatalogItem[] | null> {
  const query: Record<string, unknown> = {
    page: 0,
    size: CHOICE_SPELL_POOL_SIZE,
  };

  if (classUrls.length) {
    query.className = classUrls.join(',');
  }

  const levels = getChoiceSpellLevels(filter);

  if (levels.length) {
    query.level = levels.join(',');
  }

  try {
    const response = await $fetch<unknown>(SPELLS_SEARCH_PATH, {
      method: 'GET',
      query,
      retry: 0,
    });

    // Одноимённые записи каталога схлопываются: ответ выбора хранится
    // названием, и две «Дружбы» отмечались бы в пикере и ложились на лист вместе
    return uniqueSpellsByName(parseSpellCatalog(response));
  } catch (error) {
    consola.error('Ошибка загрузки пула заклинаний черты:', error);

    return null;
  }
}

/**
 * Заклинания перечисленного пула — записями каталога по их url.
 *
 * Запись перечисляет пул ссылками со снимком названия, а пикеру и листу нужны
 * круг и школа, поэтому каждое заклинание догружается деталью. Списки такие
 * короткие («выберите одно из трёх»), и запрос на запись дешевле новой ручки.
 *
 * @param urls url заклинаний в порядке записи.
 * @returns заклинания каталога в том же порядке; null — хоть один запрос не
 *   удался: неполный пул выглядел бы как пул, из которого что-то убрали.
 */
export async function fetchSpellsByUrls(
  urls: string[],
): Promise<SpellCatalogItem[] | null> {
  try {
    const details = await Promise.all(
      urls.map((url) =>
        $fetch<unknown>(`${SPELLS_DETAIL_BASE_PATH}/${url}`, {
          method: 'GET',
          retry: 0,
        }),
      ),
    );

    return parseSpellCatalog(details);
  } catch (error) {
    consola.error('Ошибка загрузки перечисленных заклинаний выбора:', error);

    return null;
  }
}

/**
 * Круги, которые уходят в фильтр поиска: точный круг задаётся одним значением,
 * «не выше круга» — перечислением от заговора до него, потому что фильтр
 * каталога знает только точные круги.
 *
 * @param filter ограничения пула из механики черты.
 * @returns круги для параметра `level`; пусто — круг не ограничен.
 */
function getChoiceSpellLevels(filter: FeatSpellChoiceFilter): number[] {
  if (filter.level !== null) {
    return [filter.level];
  }

  if (filter.maxLevel === null) {
    return [];
  }

  return Array.from({ length: filter.maxLevel + 1 }, (_, level) => level);
}
