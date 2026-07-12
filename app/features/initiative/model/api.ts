import type {
  AddParticipantRequest,
  TrackerDetailed,
  TrackerListItem,
  UpdateParticipantRequest,
} from './types';

import { FetchError } from 'ofetch';

import {
  INITIATIVE_API_PATH,
  TRACKER_KEY_HEADER,
  UNKNOWN_ERROR_MESSAGE,
} from './constants';
import { parseTrackerDetailed, parseTrackerList } from './schemas';

/**
 * Заголовки запроса к конкретному трекеру.
 * Для анонимного владельца добавляется `X-Tracker-Key`; авторизованному
 * пользователю Bearer-токен подставляет серверный прокси из куки.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
function trackerHeaders(accessKey?: string): Record<string, string> {
  return accessKey ? { [TRACKER_KEY_HEADER]: accessKey } : {};
}

/**
 * Достаёт HTTP-статус из ошибки `$fetch`.
 * @param error Пойманная ошибка.
 */
export function getFetchStatus(error: unknown): number | undefined {
  if (error instanceof FetchError) {
    return error.statusCode ?? error.response?.status;
  }

  return undefined;
}

/**
 * Возвращает человекочитаемое сообщение об ошибке.
 * Бэк присылает русский текст в `message` — показываем его как есть.
 * @param error Пойманная ошибка.
 */
export function getTrackerErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    return error.data?.message || error.message || UNKNOWN_ERROR_MESSAGE;
  }

  return UNKNOWN_ERROR_MESSAGE;
}

/**
 * Создать трекер. Тело опционально: `{ name }`.
 * У анонимного пользователя в ответе единственный раз придёт `accessKey`.
 * @param name Имя трекера (по умолчанию — дефолт бэка).
 */
export async function createTracker(name?: string): Promise<TrackerDetailed> {
  const response = await $fetch(INITIATIVE_API_PATH, {
    method: 'POST',
    body: name ? { name } : {},
    retry: 0,
  });

  return parseTrackerDetailed(response);
}

/**
 * Список трекеров текущего (авторизованного) пользователя.
 * @param includeDeleted Включать ли удалённые (история).
 */
export async function fetchTrackerList(
  includeDeleted = false,
): Promise<Array<TrackerListItem>> {
  const response = await $fetch(INITIATIVE_API_PATH, {
    method: 'GET',
    query: { includeDeleted },
    retry: 0,
  });

  return parseTrackerList(response);
}

/**
 * Получить трекер с участниками в порядке хода.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function fetchTracker(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(`${INITIATIVE_API_PATH}/${id}`, {
    method: 'GET',
    headers: trackerHeaders(accessKey),
    retry: 0,
  });

  return parseTrackerDetailed(response);
}

/**
 * Переименовать трекер.
 * @param id Идентификатор трекера.
 * @param name Новое имя.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function renameTracker(
  id: string,
  name: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(`${INITIATIVE_API_PATH}/${id}`, {
    method: 'PUT',
    body: { name },
    headers: trackerHeaders(accessKey),
    retry: 0,
  });

  return parseTrackerDetailed(response);
}

/**
 * Удалить трекер. У владельца — мягко (остаётся в истории),
 * у анонима — насовсем. Ответ пустой 200.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function deleteTracker(
  id: string,
  accessKey?: string,
): Promise<void> {
  await $fetch(`${INITIATIVE_API_PATH}/${id}`, {
    method: 'DELETE',
    headers: trackerHeaders(accessKey),
    retry: 0,
  });
}

/**
 * Добавить участников (игрока по одному или существ пачкой).
 * @param id Идентификатор трекера.
 * @param body Тело запроса добавления.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function addParticipants(
  id: string,
  body: AddParticipantRequest,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(`${INITIATIVE_API_PATH}/${id}/participants`, {
    method: 'POST',
    body,
    headers: trackerHeaders(accessKey),
    retry: 0,
  });

  return parseTrackerDetailed(response);
}

/**
 * Изменить участника — применяются только заполненные поля.
 * @param id Идентификатор трекера.
 * @param participantId Идентификатор участника.
 * @param body Поля для изменения.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function updateParticipant(
  id: string,
  participantId: string,
  body: UpdateParticipantRequest,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(
    `${INITIATIVE_API_PATH}/${id}/participants/${participantId}`,
    {
      method: 'PUT',
      body,
      headers: trackerHeaders(accessKey),
      retry: 0,
    },
  );

  return parseTrackerDetailed(response);
}

/**
 * Убрать участника. Если сейчас его ход — бэк сам передаёт ход следующему.
 * @param id Идентификатор трекера.
 * @param participantId Идентификатор участника.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function removeParticipant(
  id: string,
  participantId: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(
    `${INITIATIVE_API_PATH}/${id}/participants/${participantId}`,
    {
      method: 'DELETE',
      headers: trackerHeaders(accessKey),
      retry: 0,
    },
  );

  return parseTrackerDetailed(response);
}

/**
 * Прокинуть инициативу конкретному участнику (доступно и в подготовке, и в бою —
 * перебросить одного, не трогая остальных).
 * @param id Идентификатор трекера.
 * @param participantId Идентификатор участника.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function rollParticipant(
  id: string,
  participantId: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(
    `${INITIATIVE_API_PATH}/${id}/participants/${participantId}/roll`,
    {
      method: 'POST',
      headers: trackerHeaders(accessKey),
      retry: 0,
    },
  );

  return parseTrackerDetailed(response);
}

/**
 * Прокинуть инициативу всем и начать бой (раунд 1).
 * Повторный вызов = полный ре-ролл заново.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function rollInitiative(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(`${INITIATIVE_API_PATH}/${id}/roll`, {
    method: 'POST',
    headers: trackerHeaders(accessKey),
    retry: 0,
  });

  return parseTrackerDetailed(response);
}

/**
 * Начать бой, НЕ перебрасывая уже брошенное (для ручной раздачи по одному).
 * Участники без броска уходят в конец в порядке добавления.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function startTracker(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(`${INITIATIVE_API_PATH}/${id}/start`, {
    method: 'POST',
    headers: trackerHeaders(accessKey),
    retry: 0,
  });

  return parseTrackerDetailed(response);
}

/**
 * Передать ход следующему участнику; после последнего — новый раунд.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function nextTurn(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(`${INITIATIVE_API_PATH}/${id}/turn/next`, {
    method: 'POST',
    headers: trackerHeaders(accessKey),
    retry: 0,
  });

  return parseTrackerDetailed(response);
}

/**
 * Завершить бой: броски очищаются, состав сохраняется, статус снова PREPARING.
 * @param id Идентификатор трекера.
 * @param accessKey Ключ доступа анонимного трекера (если есть).
 */
export async function resetTracker(
  id: string,
  accessKey?: string,
): Promise<TrackerDetailed> {
  const response = await $fetch(`${INITIATIVE_API_PATH}/${id}/reset`, {
    method: 'POST',
    headers: trackerHeaders(accessKey),
    retry: 0,
  });

  return parseTrackerDetailed(response);
}
