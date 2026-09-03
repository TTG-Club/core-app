import type {
  AddNexusSheetRequest,
  AddNexusTrackerRequest,
  ChatEvent,
  CreateChatEventRequest,
  CreateNexusRequest,
  FightState,
  FightStateDraft,
  Nexus,
  NexusMember,
  NexusPage,
  NexusSheet,
  NexusTracker,
} from './types';

import { CHAT_HISTORY_PAGE_SIZE } from './chatConstants';
import { parseChatEvent, parseChatEvents } from './chatSchemas';
import {
  gameNexusPath,
  NEXUS_PAGE_SIZE,
  NEXUSES_PATH,
  nexusPath,
} from './constants';
import { parseFightStateSafe } from './fightSchemas';
import {
  parseNexus,
  parseNexusMembers,
  parseNexusPage,
  parseNexusSheet,
  parseNexusSheets,
  parseNexusTracker,
  parseNexusTrackers,
} from './schemas';

/**
 * Комнаты пользователя: свои и те, куда позвали. Комнат игр здесь нет — в них
 * ходят со страницы игры.
 *
 * @param page Страница выдачи.
 * @returns Страница комнат, свежие первыми.
 */
export async function fetchNexuses(page = 0): Promise<NexusPage> {
  const response = await $fetch(NEXUSES_PATH, {
    query: { page, size: NEXUS_PAGE_SIZE },
    retry: 0,
  });

  return parseNexusPage(response);
}

/**
 * Открывает комнату.
 * @param nexusId Идентификатор комнаты.
 */
export async function fetchNexus(nexusId: string): Promise<Nexus> {
  const response = await $fetch(nexusPath(nexusId), { retry: 0 });

  return parseNexus(response);
}

/**
 * Заводит самостоятельную комнату.
 * @param request Название комнаты.
 */
export async function createNexus(request: CreateNexusRequest): Promise<Nexus> {
  const response = await $fetch(NEXUSES_PATH, {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return parseNexus(response);
}

/**
 * Входит в комнату по ссылке-приглашению. Повторный переход ничего не меняет:
 * сервис отвечает той же комнатой.
 *
 * @param inviteCode Код из ссылки.
 */
export async function joinNexus(inviteCode: string): Promise<Nexus> {
  const response = await $fetch(`${NEXUSES_PATH}/join/${inviteCode}`, {
    method: 'POST',
    retry: 0,
  });

  return parseNexus(response);
}

/**
 * Состав комнаты.
 * @param nexusId Идентификатор комнаты.
 */
export async function fetchNexusMembers(
  nexusId: string,
): Promise<Array<NexusMember>> {
  const response = await $fetch(`${nexusPath(nexusId)}/members`, { retry: 0 });

  return parseNexusMembers(response);
}

/**
 * Выводит участника из самостоятельной комнаты: себя или, если это владелец,
 * кого угодно.
 *
 * @param nexusId Идентификатор комнаты.
 * @param memberId Кого выводят.
 */
export async function removeNexusMember(
  nexusId: string,
  memberId: string,
): Promise<void> {
  await $fetch(`${nexusPath(nexusId)}/members/${memberId}`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Комната игры. Заводится сервисом при первом входе, поэтому запрос и создаёт
 * её, и открывает.
 *
 * @param gameId Идентификатор игры.
 */
export async function fetchGameNexus(gameId: string): Promise<Nexus> {
  const response = await $fetch(gameNexusPath(gameId), { retry: 0 });

  return parseNexus(response);
}

/* ------------------------------------------------------------------ */
/* Чат комнаты                                                         */
/* ------------------------------------------------------------------ */

/**
 * Адрес SSE-ленты комнаты. Путь same-origin, поэтому браузер сам приложит
 * cookie сессии, а Nitro превратит её в `Authorization` для сервиса — токен в
 * адрес не попадает.
 *
 * @param nexusId Идентификатор комнаты.
 */
export function getChatStreamUrl(nexusId: string): string {
  return `${nexusPath(nexusId)}/chat/stream`;
}

/**
 * История ленты в хронологическом порядке. Для предыдущей страницы передаётся
 * `before`, равный `createdAt` самого раннего уже загруженного события.
 *
 * @param nexusId Идентификатор комнаты.
 * @param before Верхняя граница выборки.
 * @param limit Размер страницы.
 */
export async function fetchChatHistory(
  nexusId: string,
  before: string | null = null,
  limit: number = CHAT_HISTORY_PAGE_SIZE,
): Promise<Array<ChatEvent>> {
  const response = await $fetch(`${nexusPath(nexusId)}/chat/events`, {
    method: 'GET',
    query: { before: before || undefined, limit },
    retry: 0,
  });

  return parseChatEvents(response);
}

/**
 * Отправляет событие в ленту. `clientMessageId` делает повтор безопасным:
 * сервис по нему узнаёт уже сохранённое событие и возвращает его вместо
 * дубликата.
 *
 * @param nexusId Идентификатор комнаты.
 * @param request Тело события.
 */
export async function sendChatEvent(
  nexusId: string,
  request: CreateChatEventRequest,
): Promise<ChatEvent> {
  const response = await $fetch(`${nexusPath(nexusId)}/chat/events`, {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return parseChatEvent(response);
}

/* ------------------------------------------------------------------ */
/* Листы персонажей комнаты                                            */
/* ------------------------------------------------------------------ */

/**
 * Листы, выложенные в комнату.
 * @param nexusId Идентификатор комнаты.
 */
export async function fetchNexusSheets(
  nexusId: string,
): Promise<Array<NexusSheet>> {
  const response = await $fetch(`${nexusPath(nexusId)}/sheets`, { retry: 0 });

  return parseNexusSheets(response);
}

/**
 * Выкладывает лист в комнату.
 * @param nexusId Идентификатор комнаты.
 * @param request Токен общего доступа и подпись персонажа.
 */
export async function addNexusSheet(
  nexusId: string,
  request: AddNexusSheetRequest,
): Promise<NexusSheet> {
  const response = await $fetch(`${nexusPath(nexusId)}/sheets`, {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return parseNexusSheet(response);
}

/**
 * Убирает лист из комнаты: свой — кто выложил, любой — владелец комнаты.
 * @param nexusId Идентификатор комнаты.
 * @param sheetId Идентификатор листа в комнате.
 */
export async function removeNexusSheet(
  nexusId: string,
  sheetId: string,
): Promise<void> {
  await $fetch(`${nexusPath(nexusId)}/sheets/${sheetId}`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Передаёт лист другому участнику: за столом персонажей раздаёт владелец
 * комнаты.
 *
 * @param nexusId Идентификатор комнаты.
 * @param sheetId Идентификатор листа в комнате.
 * @param ownerId Кому переходит лист.
 */
export async function transferNexusSheet(
  nexusId: string,
  sheetId: string,
  ownerId: string,
): Promise<NexusSheet> {
  const response = await $fetch(
    `${nexusPath(nexusId)}/sheets/${sheetId}/owner`,
    {
      method: 'PATCH',
      body: { ownerId },
      retry: 0,
    },
  );

  return parseNexusSheet(response);
}

/* ------------------------------------------------------------------ */
/* Трекеры инициативы комнаты                                          */
/* ------------------------------------------------------------------ */

/**
 * Трекеры, заведённые в комнате.
 * @param nexusId Идентификатор комнаты.
 */
export async function fetchNexusTrackers(
  nexusId: string,
): Promise<Array<NexusTracker>> {
  const response = await $fetch(`${nexusPath(nexusId)}/trackers`, { retry: 0 });

  return parseNexusTrackers(response);
}

/**
 * Заводит трекер в комнате: сам бой уже создан в разделе трекеров.
 * @param nexusId Идентификатор комнаты.
 * @param request Трекер и его название.
 */
export async function addNexusTracker(
  nexusId: string,
  request: AddNexusTrackerRequest,
): Promise<NexusTracker> {
  const response = await $fetch(`${nexusPath(nexusId)}/trackers`, {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return parseNexusTracker(response);
}

/**
 * Убирает трекер из комнаты. Сам бой остаётся в разделе трекеров.
 * @param nexusId Идентификатор комнаты.
 * @param id Идентификатор записи трекера в комнате.
 */
export async function removeNexusTracker(
  nexusId: string,
  id: string,
): Promise<void> {
  await $fetch(`${nexusPath(nexusId)}/trackers/${id}`, {
    method: 'DELETE',
    retry: 0,
  });
}

/* ------------------------------------------------------------------ */
/* Идущий бой комнаты                                                  */
/* ------------------------------------------------------------------ */

/**
 * Снимок идущего боя; `null` — мастер ещё ничего не вёл.
 *
 * Дальше снимок приезжает сам, живой подпиской: этот запрос нужен тому, кто
 * вошёл в комнату посреди боя.
 *
 * @param nexusId Идентификатор комнаты.
 */
export async function fetchFightState(
  nexusId: string,
): Promise<FightState | null> {
  const response = await $fetch(`${nexusPath(nexusId)}/fight`, { retry: 0 });

  return response ? parseFightStateSafe(response) : null;
}

/**
 * Кладёт в комнату снимок боя. Право у владельца комнаты: бой ведёт он.
 *
 * @param nexusId Идентификатор комнаты.
 * @param draft Состояние боя на этот момент.
 */
export async function putFightState(
  nexusId: string,
  draft: FightStateDraft,
): Promise<FightState | null> {
  const response = await $fetch(`${nexusPath(nexusId)}/fight`, {
    method: 'PUT',
    body: draft,
    retry: 0,
  });

  return parseFightStateSafe(response);
}
