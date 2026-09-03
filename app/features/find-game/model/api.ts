import type {
  ChatEvent,
  ChatRoom,
  CopyGameSessionRequest,
  CreateChatEventRequest,
  CreateGameRegistrationRequest,
  CreateGameRequest,
  CreateGameSessionRequest,
  CreateGameSessionSeriesRequest,
  FindGameNotification,
  FindGameProblemDetail,
  FindGameUserProfile,
  Game,
  GameRegistration,
  GameSearchFilter,
  GameSession,
  ParticipantName,
  RegistrationDecision,
  SessionAttendanceStatus,
  SessionParticipant,
  SpringPage,
  UpdateFindGameProfileRequest,
  UpdateGameRequest,
} from './types';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import {
  CHAT_HISTORY_PAGE_SIZE,
  DISPLAY_NAMES_BY_IDS_API_PATH,
  DISPLAY_NAMES_LOOKUP_MAX,
  FIND_GAME_PROFILE_API_PATH,
  FIND_GAME_UNKNOWN_ERROR_MESSAGE,
  GAMES_API_PATH,
  NOTIFICATIONS_API_PATH,
} from './constants';
import { toGameSearchQuery } from './filters';
import {
  createGameRequestSchema,
  parseChatEvent,
  parseChatEvents,
  parseFindGameProfile,
  parseGame,
  parseGameRegistration,
  parseGameRegistrations,
  parseGameSession,
  parseGameSessions,
  parseGamesPage,
  parseNotification,
  parseNotificationsPage,
  parseParticipantNames,
  parseProblemDetail,
  parseSessionParticipant,
  parseSessionParticipants,
  parseUnreadNotifications,
} from './schemas';

/* ------------------------------------------------------------------ */
/* Ошибки                                                              */
/* ------------------------------------------------------------------ */

/**
 * HTTP-статус отказа сервиса.
 * @param error Пойманная ошибка.
 */
export function getFindGameStatus(error: unknown): number | undefined {
  if (error instanceof FetchError) {
    return error.statusCode ?? error.response?.status;
  }

  return undefined;
}

/**
 * Разбирает тело отказа в `ProblemDetail`. Сервис отвечает по RFC 7807, и
 * готовый русский текст лежит в `detail`.
 * @param error Пойманная ошибка.
 */
export function getFindGameProblem(error: unknown): FindGameProblemDetail {
  if (error instanceof FetchError) {
    return parseProblemDetail(error.data);
  }

  return parseProblemDetail(null);
}

/**
 * Человекочитаемое сообщение об ошибке сервиса.
 * @param error Пойманная ошибка.
 * @param fallback Текст, если сервис ничего внятного не прислал.
 */
export function getFindGameErrorMessage(
  error: unknown,
  fallback: string = FIND_GAME_UNKNOWN_ERROR_MESSAGE,
): string {
  const problem = getFindGameProblem(error);

  if (problem.detail) {
    return problem.detail;
  }

  if (problem.title) {
    return problem.title;
  }

  return error instanceof FetchError && error.message
    ? error.message
    : fallback;
}

/* ------------------------------------------------------------------ */
/* Пути                                                                */
/* ------------------------------------------------------------------ */

/**
 * Путь одной игры.
 * @param gameId Идентификатор игры.
 */
function gamePath(gameId: string): string {
  return `${GAMES_API_PATH}/${gameId}`;
}

/**
 * Путь сессий игры.
 * @param gameId Идентификатор игры.
 */
function sessionsPath(gameId: string): string {
  return `${gamePath(gameId)}/sessions`;
}

/**
 * Путь заявок в игру: игрок записывается в игру целиком.
 * @param gameId Идентификатор игры.
 */
function registrationsPath(gameId: string): string {
  return `${gamePath(gameId)}/registrations`;
}

/**
 * Путь состава сессии: присутствие и оплата живут у встречи.
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 */
function participantsPath(gameId: string, sessionId: string): string {
  return `${sessionsPath(gameId)}/${sessionId}/participants`;
}

/**
 * Путь ленты чата: общей у игры, отдельной у сессии или личной переписки
 * игрока с мастером.
 * @param room Адрес ленты.
 * @param suffix Хвост пути: `events` или `stream`.
 */
function chatPath(room: ChatRoom, suffix: string): string {
  return `${chatBasePath(room)}/chat/${suffix}`;
}

/** Комната ленты: личная переписка, сессия или игра целиком. */
function chatBasePath(room: ChatRoom): string {
  if (room.playerId) {
    return `${gamePath(room.gameId)}/players/${room.playerId}`;
  }

  if (room.sessionId) {
    return `${sessionsPath(room.gameId)}/${room.sessionId}`;
  }

  return gamePath(room.gameId);
}

/**
 * Адрес SSE-ленты чата. Путь same-origin, поэтому браузер сам приложит cookie
 * сессии, а Nitro превратит её в `Authorization` для сервиса — токен в адрес
 * не попадает.
 * @param room Адрес ленты.
 */
export function getChatStreamUrl(room: ChatRoom): string {
  return chatPath(room, 'stream');
}

/* ------------------------------------------------------------------ */
/* Игры                                                                */
/* ------------------------------------------------------------------ */

/**
 * Страница публичного каталога игр. Порядок задаёт сервис — на клиенте выдача
 * не пересортировывается.
 * @param filter Условия поиска.
 * @param page Номер страницы с нуля.
 * @param size Размер страницы.
 */
export async function fetchGames(
  filter: GameSearchFilter,
  page: number,
  size: number,
): Promise<SpringPage<Game>> {
  const response = await $fetch(GAMES_API_PATH, {
    method: 'GET',
    query: toGameSearchQuery(filter, page, size),
    retry: 0,
  });

  return parseGamesPage(response);
}

/**
 * Страница собственных игр мастера: и публичные, и приватные, в любом статусе.
 * Публичный поиск сюда не годится — приватные игры в него не попадают.
 * @param page Номер страницы с нуля.
 * @param size Размер страницы.
 */
export async function fetchMyGames(
  page: number,
  size: number,
): Promise<SpringPage<Game>> {
  const response = await $fetch(`${GAMES_API_PATH}/my`, {
    method: 'GET',
    query: { page, size },
    retry: 0,
  });

  return parseGamesPage(response);
}

/**
 * Одна игра. Для приватной игры обязателен код приглашения — без него сервис
 * отвечает 404, как и на несуществующую.
 * @param gameId Идентификатор игры.
 * @param inviteCode Код приглашения из адреса страницы.
 */
export async function fetchGame(
  gameId: string,
  inviteCode: string | null,
): Promise<Game> {
  const response = await $fetch(gamePath(gameId), {
    method: 'GET',
    query: { inviteCode: inviteCode || undefined },
    retry: 0,
  });

  return parseGame(response);
}

/**
 * Создаёт игру. Тело проверяется схемой перед отправкой: ограничения те же,
 * что у сервиса, поэтому очевидные ошибки видны сразу в форме.
 * @param request Параметры новой игры.
 */
export async function createGame(request: CreateGameRequest): Promise<Game> {
  const response = await $fetch(GAMES_API_PATH, {
    method: 'POST',
    body: createGameRequestSchema.parse(request),
    retry: 0,
  });

  return parseGame(response);
}

/**
 * Изменяет свою игру. Правки уходят целиком и проверяются той же схемой, что и
 * создание: форма у них общая, значит и ограничения совпадают.
 * @param gameId Идентификатор игры.
 * @param request Новые параметры игры.
 */
export async function updateGame(
  gameId: string,
  request: UpdateGameRequest,
): Promise<Game> {
  const response = await $fetch(gamePath(gameId), {
    method: 'PUT',
    body: createGameRequestSchema.parse(request),
    retry: 0,
  });

  return parseGame(response);
}

/**
 * Отмечает игру несостоявшейся. Отдельный исход, а не разновидность
 * завершения: по завершённым играм мастера видно, что он действительно провёл.
 * @param gameId Идентификатор игры.
 */
export async function cancelGame(gameId: string): Promise<void> {
  await $fetch(`${GAMES_API_PATH}/${gameId}/cancel`, {
    method: 'PATCH',
    retry: 0,
  });
}

/**
 * Завершает свою игру: после этого мастер без подписки может создать следующую.
 * @param gameId Идентификатор игры.
 */
export async function closeGame(gameId: string): Promise<void> {
  await $fetch(`${gamePath(gameId)}/close`, { method: 'PATCH', retry: 0 });
}

/**
 * Поднимает свою открытую публичную игру в начало каталога.
 * При слишком раннем запросе сервис отвечает 429 и кладёт время следующей
 * попытки в `availableAt`.
 * @param gameId Идентификатор игры.
 */
export async function raiseGame(gameId: string): Promise<Game> {
  const response = await $fetch(`${gamePath(gameId)}/raise`, {
    method: 'PATCH',
    retry: 0,
  });

  return parseGame(response);
}

/**
 * Мягко удаляет игру (администратор или модератор): игра исчезает из поиска и
 * становится недоступна по прямой ссылке и коду приглашения.
 * @param gameId Идентификатор игры.
 * @param reason Причина для административного аудита.
 */
export async function deleteGame(
  gameId: string,
  reason: string,
): Promise<void> {
  await $fetch(gamePath(gameId), {
    method: 'DELETE',
    body: { reason },
    retry: 0,
  });
}

/* ------------------------------------------------------------------ */
/* Сессии                                                              */
/* ------------------------------------------------------------------ */

/**
 * Сессии игры. Требует входа: гостю сервис список сессий не отдаёт.
 * Для приватной игры не-владельцу нужен код приглашения.
 * @param gameId Идентификатор игры.
 * @param inviteCode Код приглашения из адреса страницы.
 */
export async function fetchGameSessions(
  gameId: string,
  inviteCode: string | null,
): Promise<Array<GameSession>> {
  const response = await $fetch(sessionsPath(gameId), {
    method: 'GET',
    query: { inviteCode: inviteCode || undefined },
    retry: 0,
  });

  return parseGameSessions(response);
}

/**
 * Создаёт сессию игры (только мастер-владелец).
 * @param gameId Идентификатор игры.
 * @param request Параметры сессии.
 */
export async function createGameSession(
  gameId: string,
  request: CreateGameSessionRequest,
): Promise<GameSession> {
  const response = await $fetch(sessionsPath(gameId), {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return parseGameSession(response);
}

/**
 * Создаёт серию сессий по расписанию (только мастер-владелец).
 * @param gameId Идентификатор игры.
 * @param request Расписание серии.
 * @returns Созданные встречи в порядке времени.
 */
export async function createGameSessionSeries(
  gameId: string,
  request: CreateGameSessionSeriesRequest,
): Promise<Array<GameSession>> {
  const response = await $fetch(`${sessionsPath(gameId)}/series`, {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return parseGameSessions(response);
}

/**
 * Создаёт сессию копированием предыдущей. Переносятся стоимость, условия
 * оплаты и принятые игроки; присутствие каждого сбрасывается на «не буду».
 * @param gameId Идентификатор игры.
 * @param sourceSessionId Сессия-источник.
 * @param request Дата новой сессии и необязательное название.
 */
export async function copyGameSession(
  gameId: string,
  sourceSessionId: string,
  request: CopyGameSessionRequest,
): Promise<GameSession> {
  const response = await $fetch(
    `${sessionsPath(gameId)}/${sourceSessionId}/copy`,
    { method: 'POST', body: request, retry: 0 },
  );

  return parseGameSession(response);
}

/**
 * Назначает дату сессии, объявленной с открытой датой.
 *
 * Один раз: уже назначенное время сервис переносить не даёт — игроки под него
 * подстроились.
 *
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 * @param startsAt Начало сессии в ISO-формате.
 */
export async function scheduleGameSession(
  gameId: string,
  sessionId: string,
  startsAt: string,
): Promise<GameSession> {
  const response = await $fetch(
    `${sessionsPath(gameId)}/${sessionId}/schedule`,
    { method: 'PATCH', body: { startsAt }, retry: 0 },
  );

  return parseGameSession(response);
}

/**
 * Переводит сессию в «идёт»: отсюда открывается чат сессии.
 *
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 */
export async function startGameSession(
  gameId: string,
  sessionId: string,
): Promise<GameSession> {
  const response = await $fetch(`${sessionsPath(gameId)}/${sessionId}/start`, {
    method: 'PATCH',
    retry: 0,
  });

  return parseGameSession(response);
}

/**
 * Отменяет сессию: она не состоялась. От завершения отличается только
 * исходом, но игроку разница важна — по завершённым видно, что было сыграно.
 *
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 */
export async function cancelGameSession(
  gameId: string,
  sessionId: string,
): Promise<GameSession> {
  const response = await $fetch(`${sessionsPath(gameId)}/${sessionId}/cancel`, {
    method: 'PATCH',
    retry: 0,
  });

  return parseGameSession(response);
}

/**
 * Завершает сессию: она сыграна. Сессия уходит из предстоящих, и места в ней
 * больше не заняты.
 *
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 */
export async function completeGameSession(
  gameId: string,
  sessionId: string,
): Promise<GameSession> {
  const response = await $fetch(
    `${sessionsPath(gameId)}/${sessionId}/complete`,
    { method: 'PATCH', retry: 0 },
  );

  return parseGameSession(response);
}

/* ------------------------------------------------------------------ */
/* Уведомления                                                         */
/* ------------------------------------------------------------------ */

/**
 * Лента уведомлений: свежие сверху.
 * @param page Номер страницы с нуля.
 * @param size Размер страницы.
 */
export async function fetchNotifications(
  page: number,
  size: number,
): Promise<SpringPage<FindGameNotification>> {
  const response = await $fetch(NOTIFICATIONS_API_PATH, {
    query: { page, size },
  });

  return parseNotificationsPage(response);
}

/** Сколько уведомлений не прочитано — для значка на колокольчике. */
export async function fetchUnreadNotifications(): Promise<number> {
  const response = await $fetch(`${NOTIFICATIONS_API_PATH}/unread-count`);

  return parseUnreadNotifications(response);
}

/**
 * Отмечает уведомление прочитанным.
 * @param notificationId Идентификатор уведомления.
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<FindGameNotification> {
  const response = await $fetch(
    `${NOTIFICATIONS_API_PATH}/${notificationId}/read`,
    { method: 'PATCH', retry: 0 },
  );

  return parseNotification(response);
}

/** Отмечает прочитанной всю ленту. */
export async function markAllNotificationsRead(): Promise<void> {
  await $fetch(`${NOTIFICATIONS_API_PATH}/read`, {
    method: 'PATCH',
    retry: 0,
  });
}

/* ------------------------------------------------------------------ */
/* Заявки в игру                                                       */
/* ------------------------------------------------------------------ */

/**
 * Подаёт заявку в игру. Одну на игру: принятый игрок попадает во все её
 * запланированные сессии.
 *
 * @param gameId Идентификатор игры.
 * @param request Как игрок представил персонажа: лист, ссылка или имя.
 * @param inviteCode Код приглашения из адреса страницы.
 */
export async function createGameRegistration(
  gameId: string,
  request: CreateGameRegistrationRequest,
  inviteCode: string | null,
): Promise<GameRegistration> {
  const response = await $fetch(registrationsPath(gameId), {
    method: 'POST',
    query: { inviteCode: inviteCode || undefined },
    body: request,
    retry: 0,
  });

  return parseGameRegistration(response);
}

/**
 * Собственная заявка игрока.
 *
 * Отсутствие заявки сервис отдаёт как 404 — здесь это `null`, а не ошибка:
 * «заявки ещё не было» для интерфейса такое же нормальное состояние, как
 * `PENDING` или `REJECTED`.
 *
 * @param gameId Идентификатор игры.
 * @param inviteCode Код приглашения из адреса страницы.
 */
export async function fetchOwnGameRegistration(
  gameId: string,
  inviteCode: string | null,
): Promise<GameRegistration | null> {
  try {
    const response = await $fetch(`${registrationsPath(gameId)}/me`, {
      method: 'GET',
      query: { inviteCode: inviteCode || undefined },
      retry: 0,
    });

    return parseGameRegistration(response);
  } catch (error) {
    if (getFindGameStatus(error) === StatusCodes.NOT_FOUND) {
      return null;
    }

    throw error;
  }
}

/**
 * Отзывает собственную заявку. Принятую так не отозвать: место согласовано,
 * и об уходе договариваются с мастером.
 *
 * @param gameId Идентификатор игры.
 */
export async function withdrawGameRegistration(gameId: string): Promise<void> {
  await $fetch(`${registrationsPath(gameId)}/me`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Заявки игры со ссылками на листы персонажей (только мастер-владелец).
 * @param gameId Идентификатор игры.
 */
export async function fetchGameRegistrations(
  gameId: string,
): Promise<Array<GameRegistration>> {
  const response = await $fetch(registrationsPath(gameId), {
    method: 'GET',
    retry: 0,
  });

  return parseGameRegistrations(response);
}

/**
 * Принимает или отклоняет заявку (только мастер-владелец).
 * @param gameId Идентификатор игры.
 * @param registrationId Идентификатор заявки.
 * @param decision Решение мастера.
 * @param reason Причина отказа; необязательна и осмысленна только при отказе.
 */
export async function reviewGameRegistration(
  gameId: string,
  registrationId: string,
  decision: RegistrationDecision,
  reason?: string,
): Promise<GameRegistration> {
  const response = await $fetch(
    `${registrationsPath(gameId)}/${registrationId}`,
    {
      method: 'PATCH',
      body: { decision, reason: reason || undefined },
      retry: 0,
    },
  );

  return parseGameRegistration(response);
}

/* ------------------------------------------------------------------ */
/* Участие в сессии                                                    */
/* ------------------------------------------------------------------ */

/**
 * Состав сессии (только мастер-владелец).
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 */
export async function fetchSessionParticipants(
  gameId: string,
  sessionId: string,
): Promise<Array<SessionParticipant>> {
  const response = await $fetch(participantsPath(gameId, sessionId), {
    method: 'GET',
    retry: 0,
  });

  return parseSessionParticipants(response);
}

/**
 * Собственное участие игрока в сессии; `null` — игрок не в составе.
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 * @param inviteCode Код приглашения из адреса страницы.
 */
export async function fetchOwnSessionParticipation(
  gameId: string,
  sessionId: string,
  inviteCode: string | null,
): Promise<SessionParticipant | null> {
  try {
    const response = await $fetch(`${participantsPath(gameId, sessionId)}/me`, {
      method: 'GET',
      query: { inviteCode: inviteCode || undefined },
      retry: 0,
    });

    return parseSessionParticipant(response);
  } catch (error) {
    if (getFindGameStatus(error) === StatusCodes.NOT_FOUND) {
      return null;
    }

    throw error;
  }
}

/**
 * Меняет собственное присутствие в сессии.
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 * @param attendanceStatus Новый статус присутствия.
 */
export async function updateSessionAttendance(
  gameId: string,
  sessionId: string,
  attendanceStatus: SessionAttendanceStatus,
): Promise<SessionParticipant> {
  const response = await $fetch(
    `${participantsPath(gameId, sessionId)}/me/attendance`,
    { method: 'PATCH', body: { attendanceStatus }, retry: 0 },
  );

  return parseSessionParticipant(response);
}

/**
 * Отмечает оплату участника или снимает ошибочную отметку. Доступно только
 * мастеру платной игры.
 *
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор сессии.
 * @param playerId Идентификатор игрока.
 * @param paid Оплачено или нет.
 */
export async function updateParticipantPayment(
  gameId: string,
  sessionId: string,
  playerId: string,
  paid: boolean,
): Promise<SessionParticipant> {
  const response = await $fetch(
    `${participantsPath(gameId, sessionId)}/${playerId}/payment`,
    { method: 'PATCH', body: { paid }, retry: 0 },
  );

  return parseSessionParticipant(response);
}

/* ------------------------------------------------------------------ */
/* Профиль                                                             */
/* ------------------------------------------------------------------ */

/**
 * Профиль поиска игр. Первый запрос создаёт профиль на стороне сервиса,
 * поэтому отдельного «создать» не существует.
 */
export async function fetchFindGameProfile(): Promise<FindGameUserProfile> {
  const response = await $fetch(FIND_GAME_PROFILE_API_PATH, {
    method: 'GET',
    retry: 0,
  });

  return parseFindGameProfile(response);
}

/**
 * Сохраняет профиль. Анкеты Мастера и Игрока независимы, но сервис принимает
 * их только вместе, поэтому обе уходят в каждом запросе.
 * @param request Тело обновления профиля.
 */
export async function updateFindGameProfile(
  request: UpdateFindGameProfileRequest,
): Promise<FindGameUserProfile> {
  const response = await $fetch(FIND_GAME_PROFILE_API_PATH, {
    method: 'PUT',
    body: request,
    retry: 0,
  });

  return parseFindGameProfile(response);
}

/* ------------------------------------------------------------------ */
/* Чат                                                                 */
/* ------------------------------------------------------------------ */

/**
 * История ленты в хронологическом порядке. Для предыдущей страницы передаётся
 * `before`, равный `createdAt` самого раннего уже загруженного события.
 * @param room Адрес ленты.
 * @param before Верхняя граница выборки.
 * @param limit Размер страницы.
 */
export async function fetchChatHistory(
  room: ChatRoom,
  before: string | null = null,
  limit: number = CHAT_HISTORY_PAGE_SIZE,
): Promise<Array<ChatEvent>> {
  const response = await $fetch(chatPath(room, 'events'), {
    method: 'GET',
    query: { before: before || undefined, limit },
    retry: 0,
  });

  return parseChatEvents(response);
}

/**
 * Отправляет событие в ленту. `clientMessageId` делает повтор безопасным:
 * сервис вернёт уже сохранённое событие вместо дубликата.
 * @param room Адрес ленты.
 * @param request Тело события.
 */
export async function sendChatEvent(
  room: ChatRoom,
  request: CreateChatEventRequest,
): Promise<ChatEvent> {
  const response = await $fetch(chatPath(room, 'events'), {
    method: 'POST',
    body: request,
    retry: 0,
  });

  return parseChatEvent(response);
}

/* ------------------------------------------------------------------ */
/* Имена участников                                                    */
/* ------------------------------------------------------------------ */

/**
 * Резолвит идентификаторы участников в отображаемые имена через core-api —
 * владельца этих данных. find-game-api имён не хранит вовсе, поэтому без
 * резолва в списке игроков и в чате остался бы сырой UUID.
 *
 * Резолв вспомогательный: сбой не должен ронять страницу игры, поэтому вместо
 * исключения возвращается пустой список, а вызывающий подставляет заглушку.
 *
 * @param userIds Идентификаторы участников.
 */
export async function fetchParticipantNames(
  userIds: ReadonlyArray<string>,
): Promise<Array<ParticipantName>> {
  const unique = [...new Set(userIds.filter(Boolean))].slice(
    0,
    DISPLAY_NAMES_LOOKUP_MAX,
  );

  if (!unique.length) {
    return [];
  }

  try {
    const response = await $fetch(DISPLAY_NAMES_BY_IDS_API_PATH, {
      method: 'POST',
      body: { userIds: unique },
      retry: 0,
    });

    return parseParticipantNames(response);
  } catch (error) {
    consola.warn(
      '[find-game] Не удалось получить имена участников:',
      getFindGameStatus(error),
    );

    return [];
  }
}
