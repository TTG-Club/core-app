import type {
  CatalogSpellDetail,
  Character,
  CharacterInventoryItem,
  CharacterSheetDetail,
  CharacterSheetListPage,
  FeatSummary,
  FeatureDescriptionNode,
  SavedCharacterSheet,
  SavedCharacterSheetListPage,
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
  FEATS_DETAIL_BASE_PATH,
  SHEET_UNKNOWN_ERROR_MESSAGE,
  SPELLS_DETAIL_BASE_PATH,
} from './constants';
import {
  parseCatalogDescription,
  parseCatalogSpellDetail,
  parseFeatDetail,
} from './schemas';
import { getInventoryItemDetailPath } from './utils';

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
