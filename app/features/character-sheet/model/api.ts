import type {
  Character,
  CharacterSheetDetail,
  CharacterSheetListPage,
} from './types';

import { FetchError } from 'ofetch';

import {
  parseCharacterSheetDetail,
  parseCharacterSheetListPage,
} from './character-schema';
import {
  CHARACTER_SHEET_API_PATH,
  SHEET_UNKNOWN_ERROR_MESSAGE,
} from './constants';

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

  return SHEET_UNKNOWN_ERROR_MESSAGE;
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
