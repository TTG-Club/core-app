import type {
  CityOption,
  CopyGameSessionRequest,
  CreateGameRegistrationRequest,
  CreateGameRequest,
  CreateGameSessionRequest,
  CreateGameSessionSeriesRequest,
  CreateSessionReviewRequest,
  FindGameNotification,
  FindGameProblemDetail,
  FindGameUserProfile,
  Follow,
  Game,
  GameRegistration,
  GameSearchFilter,
  GameSession,
  GameStatus,
  MasterPublicProfile,
  ParticipantName,
  RegistrationDecision,
  Reputation,
  SessionAttendanceStatus,
  SessionParticipant,
  SessionReview,
  SpringPage,
  UpdateFindGameProfileRequest,
  UpdateGameRequest,
} from './types';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import {
  BOOKMARKED_PLAYERS_API_PATH,
  CITIES_API_PATH,
  DISPLAY_NAMES_BY_IDS_API_PATH,
  DISPLAY_NAMES_LOOKUP_MAX,
  FIND_GAME_PROFILE_API_PATH,
  FIND_GAME_UNKNOWN_ERROR_MESSAGE,
  FOLLOWED_MASTERS_API_PATH,
  GAMES_API_PATH,
  MASTER_PROFILE_API_PATH,
  NOTIFICATIONS_API_PATH,
  OWN_REPUTATION_API_PATH,
  PLAYER_BOOKMARK_API_PATH,
  RETRY_AFTER_PREFIX,
} from './constants';
import { toGameSearchQuery } from './filters';
import {
  createGameRequestSchema,
  parseCities,
  parseFindGameProfile,
  parseFollows,
  parseGame,
  parseGameRegistration,
  parseGameRegistrations,
  parseGameSession,
  parseGameSessions,
  parseGamesPage,
  parseMasterProfile,
  parseNotification,
  parseNotificationsPage,
  parseParticipantNames,
  parseProblemDetail,
  parseReputation,
  parseSessionParticipant,
  parseSessionParticipants,
  parseSessionReview,
  parseSessionReviews,
  parseUnreadNotifications,
} from './schemas';
import { getWaitLabel } from './utils';

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
function getFindGameProblem(error: unknown): FindGameProblemDetail {
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

  // Отказ по норме попыток сервис объясняет моментом «можно с такого-то
  // времени». Человеку нужен срок, а не дата в UTC.
  if (problem.availableAt) {
    const wait = getWaitLabel(problem.availableAt);

    if (wait) {
      return `${RETRY_AFTER_PREFIX} ${wait}`;
    }
  }

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
  statuses: ReadonlyArray<GameStatus> = [],
): Promise<SpringPage<Game>> {
  const response = await $fetch(`${GAMES_API_PATH}/my`, {
    method: 'GET',
    // Без отбора сервис не отдаёт отменённые: они не состоялись, и в общем
    // списке своих игр им место только по прямому запросу.
    query: { page, size, ...(statuses.length ? { status: statuses } : {}) },
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
 * Публичный профиль мастера: рассказ о себе и счётчики его игр.
 * @param masterId Идентификатор мастера.
 */
export async function fetchMasterProfile(
  masterId: string,
): Promise<MasterPublicProfile> {
  const response = await $fetch(`${MASTER_PROFILE_API_PATH}/${masterId}`, {
    retry: 0,
  });

  return parseMasterProfile(response);
}

/**
 * Отзывы о мастере: их читают в его профиле до всякой заявки.
 * @param masterId Идентификатор мастера.
 */
export async function fetchMasterReviews(
  masterId: string,
): Promise<Array<SessionReview>> {
  const response = await $fetch(
    `${MASTER_PROFILE_API_PATH}/${masterId}/reviews`,
    {
      retry: 0,
    },
  );

  return parseSessionReviews(response);
}

/**
 * Своя репутация игрока: доля оценок без текстов и авторов.
 *
 * Игрок знает, где стоит, но не идёт выяснять отношения с конкретным
 * мастером — иначе отзывы стали бы осторожными и бесполезными.
 */
export async function fetchOwnReputation(): Promise<Reputation> {
  const response = await $fetch(OWN_REPUTATION_API_PATH, { retry: 0 });

  return parseReputation(response);
}

/**
 * Ставит оценку участнику завершённой встречи; повторная правит свою же.
 *
 * Пока не ответила вторая сторона, оценка видна только автору — иначе
 * увидевший первым отвечал бы тем же.
 *
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор встречи.
 * @param request Кого и как оценили.
 */
export async function submitSessionReview(
  gameId: string,
  sessionId: string,
  request: CreateSessionReviewRequest,
): Promise<SessionReview> {
  const response = await $fetch(
    `${GAMES_API_PATH}/${gameId}/sessions/${sessionId}/reviews`,
    { method: 'POST', body: request, retry: 0 },
  );

  return parseSessionReview(response);
}

/**
 * Оценки встречи глазами пользователя: свои — всегда, чужие о нём — как
 * только пара раскрыта.
 *
 * @param gameId Идентификатор игры.
 * @param sessionId Идентификатор встречи.
 */
export async function fetchSessionReviews(
  gameId: string,
  sessionId: string,
): Promise<Array<SessionReview>> {
  const response = await $fetch(
    `${GAMES_API_PATH}/${gameId}/sessions/${sessionId}/reviews`,
    { retry: 0 },
  );

  return parseSessionReviews(response);
}

/**
 * Репутация игрока для мастера, разбирающего его заявку. Сервис отдаёт её
 * только мастеру игры и только пока игрок в неё просится.
 *
 * @param gameId Идентификатор игры.
 * @param playerId Идентификатор игрока.
 */
export async function fetchPlayerReputation(
  gameId: string,
  playerId: string,
): Promise<Reputation> {
  const response = await $fetch(
    `${GAMES_API_PATH}/${gameId}/players/${playerId}/reputation`,
    { retry: 0 },
  );

  return parseReputation(response);
}

/**
 * Отзывы об игроке для мастера, разбирающего его заявку.
 * @param gameId Идентификатор игры.
 * @param playerId Идентификатор игрока.
 */
export async function fetchPlayerReviews(
  gameId: string,
  playerId: string,
): Promise<Array<SessionReview>> {
  const response = await $fetch(
    `${GAMES_API_PATH}/${gameId}/players/${playerId}/reviews`,
    { retry: 0 },
  );

  return parseSessionReviews(response);
}

/**
 * Отмечает мастера: его новые игры будут приходить уведомлением.
 * @param masterId Идентификатор мастера.
 */
export async function followMaster(masterId: string): Promise<void> {
  await $fetch(`${MASTER_PROFILE_API_PATH}/${masterId}/follow`, {
    method: 'PUT',
    retry: 0,
  });
}

/**
 * Снимает отметку с мастера.
 * @param masterId Идентификатор мастера.
 */
export async function unfollowMaster(masterId: string): Promise<void> {
  await $fetch(`${MASTER_PROFILE_API_PATH}/${masterId}/follow`, {
    method: 'DELETE',
    retry: 0,
  });
}

/**
 * Отмечает игрока, чтобы звать его в свои игры. Сервис принимает отметку
 * только о том, кто уже просился в игру этого мастера.
 * @param playerId Идентификатор игрока.
 */
export async function bookmarkPlayer(playerId: string): Promise<void> {
  await $fetch(`${PLAYER_BOOKMARK_API_PATH}/${playerId}/bookmark`, {
    method: 'PUT',
    retry: 0,
  });
}

/**
 * Снимает отметку с игрока.
 * @param playerId Идентификатор игрока.
 */
export async function unbookmarkPlayer(playerId: string): Promise<void> {
  await $fetch(`${PLAYER_BOOKMARK_API_PATH}/${playerId}/bookmark`, {
    method: 'DELETE',
    retry: 0,
  });
}

/** Отмеченные мастера — свежие сверху. */
export async function fetchFollowedMasters(): Promise<Array<Follow>> {
  const response = await $fetch(FOLLOWED_MASTERS_API_PATH, { retry: 0 });

  return parseFollows(response);
}

/** Отмеченные игроки — свежие сверху. */
export async function fetchBookmarkedPlayers(): Promise<Array<Follow>> {
  const response = await $fetch(BOOKMARKED_PLAYERS_API_PATH, { retry: 0 });

  return parseFollows(response);
}

/**
 * Зовёт отмеченного игрока в свою игру.
 *
 * Приглашение — уведомление со ссылкой, а не место в составе: заявку игрок
 * подаёт сам.
 *
 * @param gameId Идентификатор игры.
 * @param playerId Идентификатор игрока.
 */
export async function invitePlayer(
  gameId: string,
  playerId: string,
): Promise<void> {
  await $fetch(`${GAMES_API_PATH}/${gameId}/invites`, {
    method: 'POST',
    body: { playerId },
    retry: 0,
  });
}

/**
 * Подсказки городов из справочника сервиса.
 *
 * Пустой запрос отдаёт крупнейшие города — с них и начинают выбор.
 *
 * @param query Начало названия города.
 */
export async function fetchCities(query: string): Promise<Array<CityOption>> {
  const response = await $fetch(CITIES_API_PATH, {
    query: query ? { q: query } : undefined,
    retry: 0,
  });

  return parseCities(response);
}

/**
 * Закрывает набор в игру досрочно: группа собрана, и новые заявки мастеру не
 * нужны. Сервис отвечает 400, пока не набран минимум для старта.
 * @param gameId Идентификатор игры.
 */
export async function closeGameRecruitment(gameId: string): Promise<Game> {
  const response = await $fetch(`${gamePath(gameId)}/recruitment/close`, {
    method: 'PATCH',
    retry: 0,
  });

  return parseGame(response);
}

/**
 * Открывает набор снова. Сервис отвечает 400, если свободных мест нет.
 * @param gameId Идентификатор игры.
 */
export async function openGameRecruitment(gameId: string): Promise<Game> {
  const response = await $fetch(`${gamePath(gameId)}/recruitment/open`, {
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
