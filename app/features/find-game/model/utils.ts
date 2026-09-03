import type {
  ChatDiceRoll,
  ChatFeedEvent,
  ChatRoom,
  Game,
  GameSession,
} from './types';

import {
  CHAT_AUTHOR_GROUP_GAP,
  GAME_COST_TYPE_LABELS,
  GAME_TYPE_LABELS,
  GAMES_ROUTE,
  INVITE_CODE_QUERY_KEY,
  PRIVATE_CHAT_ROOM_PREFIX,
  SESSION_PAYMENT_TYPE_LABELS,
} from './constants';

/** Сколько минут в часе — для разбивки длительности сессии. */
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;

/**
 * Подпись формата игры. У офлайн-игры к формату добавляется город: без него
 * «Вживую» ничего не говорит о том, доедет ли игрок.
 * @param game Игра.
 */
export function getGameFormatLabel(game: Game): string {
  const format = GAME_TYPE_LABELS[game.type];

  if (game.type === 'OFFLINE' && game.city) {
    return `${format}, ${game.city}`;
  }

  return format;
}

/**
 * Ключ ленты личной переписки с мастером.
 * @param playerId Идентификатор игрока.
 */
export function getPrivateChatRoomKey(playerId: string): string {
  return `${PRIVATE_CHAT_ROOM_PREFIX}${playerId}`;
}

/**
 * Игрок, чья это личная переписка; `null` — ключ не от неё.
 * @param roomKey Ключ активной ленты.
 */
export function getPrivateChatPlayerId(roomKey: string): string | null {
  return roomKey.startsWith(PRIVATE_CHAT_ROOM_PREFIX)
    ? roomKey.slice(PRIVATE_CHAT_ROOM_PREFIX.length)
    : null;
}

/**
 * Расшифровка занятости мест. Числа с карточки убраны — остались только
 * значки, и вслух они сами по себе ничего не значат, поэтому подпись несёт
 * и занятость, и порог старта. Она же показывается по наведению.
 * @param game Игра.
 */
export function getGameSeatsHint(game: Game): string {
  const seats = getPlural(game.maxPlayers, ['места', 'мест', 'мест']);
  const parts = [`Занято ${game.takenSeats} из ${game.maxPlayers} ${seats}`];
  const pending = game.takenSeats - game.approvedSeats;

  if (pending > 0) {
    parts.push(`${pending} ждёт подтверждения`);
  }

  if (game.playersToStart < game.maxPlayers) {
    parts.push(`для старта нужно ${game.playersToStart}`);
  }

  return parts.join(', ');
}

/**
 * Подпись количества игроков: сколько нужно для старта и сколько максимум.
 * @param game Игра.
 */
export function getGamePlayersLabel(game: Game): string {
  const players = getPlural(game.maxPlayers, ['игрок', 'игрока', 'игроков']);

  if (game.playersToStart === game.maxPlayers) {
    return `${game.maxPlayers} ${players}`;
  }

  return `${game.playersToStart}–${game.maxPlayers} ${players}`;
}

/**
 * Подпись возрастных ограничений. Границы независимы: может быть задана
 * только нижняя, только верхняя, обе или ни одной.
 * @param game Игра.
 */
export function getGameAgeLabel(game: Game): string | null {
  if (game.minAge !== null && game.maxAge !== null) {
    return `${game.minAge}–${game.maxAge} лет`;
  }

  if (game.minAge !== null) {
    return `${game.minAge}+`;
  }

  if (game.maxAge !== null) {
    return `до ${game.maxAge} лет`;
  }

  return null;
}

/**
 * Подпись платности игры. Конкретная сумма задаётся у каждой сессии отдельно,
 * поэтому у самой игры показывается только тип стоимости.
 * @param game Игра.
 */
export function getGameCostLabel(game: Game): string {
  return GAME_COST_TYPE_LABELS[game.costType];
}

/**
 * Подпись стартового уровня персонажей.
 * @param game Игра.
 */
export function getGameStartingLevelLabel(game: Game): string {
  return `${game.startingLevel} уровень`;
}

/**
 * Подпись стоимости сессии вместе с условиями оплаты.
 * У бесплатной игры платёжных полей нет вовсе.
 * @param session Сессия игры.
 */
export function getSessionPriceLabel(session: GameSession): string | null {
  if (session.priceAmount === null || !session.priceCurrency) {
    return null;
  }

  const price = `${session.priceAmount.toFixed(2)} ${session.priceCurrency}`;

  if (!session.paymentType) {
    return price;
  }

  return `${price} · ${SESSION_PAYMENT_TYPE_LABELS[session.paymentType]}`;
}

/**
 * Подпись предполагаемой длительности сессии.
 * @param minutes Длительность в минутах.
 */
export function getSessionDurationLabel(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) {
    return null;
  }

  const hours = Math.floor(minutes / MINUTES_IN_HOUR);
  const rest = minutes % MINUTES_IN_HOUR;

  if (!hours) {
    return `${rest} мин`;
  }

  const hoursLabel = `${hours} ${getPlural(hours, ['час', 'часа', 'часов'])}`;

  return rest ? `${hoursLabel} ${rest} мин` : hoursLabel;
}

/**
 * Ссылка на страницу игры. Код приглашения нужен только приватной игре и
 * никогда не сохраняется — он живёт ровно в адресе страницы.
 * @param gameId Идентификатор игры.
 * @param inviteCode Код приглашения.
 */
export function getGameRoute(
  gameId: string,
  inviteCode: string | null = null,
): string {
  const path = `${GAMES_ROUTE}/${gameId}`;

  if (!inviteCode) {
    return path;
  }

  return `${path}?${INVITE_CODE_QUERY_KEY}=${encodeURIComponent(inviteCode)}`;
}

/**
 * Полная ссылка-приглашение в приватную игру — то, что мастер отправляет
 * игрокам.
 * @param gameId Идентификатор игры.
 * @param inviteCode Код приглашения.
 */
export function getGameInviteLink(gameId: string, inviteCode: string): string {
  return `${getOrigin()}${getGameRoute(gameId, inviteCode)}`;
}

/**
 * Приводит момент времени к значению поля `datetime-local`.
 *
 * Поле работает в местном времени браузера без указания зоны — ровно то, что
 * нужно мастеру: он назначает сессию по своим часам, а на сервер уходит UTC.
 *
 * @param isoDate Момент времени в ISO-формате.
 */
export function toLocalDateTimeInput(isoDate: string | null): string {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value: number) => `${value}`.padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

/**
 * Значение по умолчанию для поля начала сессии: ближайший целый час.
 *
 * Не «сейчас»: сервис требует `@FutureOrPresent`, и пока мастер заполняет
 * форму, текущий момент успел бы уйти в прошлое, а запрос — получить 400.
 */
export function getDefaultSessionStart(): string {
  const start = new Date();

  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  return toLocalDateTimeInput(start.toISOString());
}

/**
 * Сегодняшняя дата для поля `date`. Время у сессии задаётся отдельно
 * границами встречи, поэтому в дате его нет.
 */
export function getDefaultSessionDate(): string {
  return toLocalDateTimeInput(new Date().toISOString()).slice(0, 10);
}

/**
 * Длительность встречи по её началу и концу.
 *
 * Мастер думает не длительностью, а временем: «с семи до одиннадцати». Конец
 * раньше начала означает переход через полночь — вечерние игры заканчиваются
 * за полночь чаще, чем длятся отрицательное время.
 *
 * @param startMinutes Минуты от полуночи до начала.
 * @param endMinutes Минуты от полуночи до конца.
 * @returns Длительность в минутах; `null`, если границы совпали.
 */
export function durationBetween(
  startMinutes: number,
  endMinutes: number,
): number | null {
  const raw = endMinutes - startMinutes;
  const total = raw > 0 ? raw : raw + MINUTES_IN_DAY;

  return total > 0 && total < MINUTES_IN_DAY ? total : null;
}

/**
 * Приводит значение поля `datetime-local` к ISO-строке в UTC.
 * @param value Значение поля в местном времени.
 */
export function fromLocalDateTimeInput(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Ленты чата совпадают.
 * @param first Первая лента.
 * @param second Вторая лента.
 */
export function isSameChatRoom(first: ChatRoom, second: ChatRoom): boolean {
  return first.gameId === second.gameId && first.sessionId === second.sessionId;
}

/**
 * Короткая запись броска: выражение, выпавшие значения и модификатор.
 * Итог сервер уже посчитал, поэтому здесь ничего не складывается заново.
 * @param roll Результат броска.
 */
export function getDiceRollBreakdown(roll: ChatDiceRoll): string {
  const values = roll.results.join(' + ');

  if (!roll.modifier) {
    return values;
  }

  const sign = roll.modifier > 0 ? '+' : '−';

  return `${values} ${sign} ${Math.abs(roll.modifier)}`;
}

/**
 * Начинается ли новая группа сообщений: у другого автора или после большой
 * паузы. Группировка чисто визуальная — она не меняет порядок событий.
 * @param event Текущее событие ленты.
 * @param previous Предыдущее событие ленты.
 */
export function startsNewAuthorGroup(
  event: ChatFeedEvent,
  previous: ChatFeedEvent | undefined,
): boolean {
  if (!previous || previous.authorId !== event.authorId) {
    return true;
  }

  const gap =
    new Date(event.createdAt).getTime()
    - new Date(previous.createdAt).getTime();

  return !Number.isFinite(gap) || gap > CHAT_AUTHOR_GROUP_GAP;
}

/**
 * День события в виде `YYYY-MM-DD` по местному времени — ключ разделителя дат
 * в ленте.
 * @param isoDate Дата события в ISO-формате.
 */
export function getChatDayKey(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Сортирует события по времени, а при совпадении — по идентификатору.
 * Второй ключ нужен, чтобы события одной миллисекунды не менялись местами
 * между догрузкой истории и приходом их же по подписке.
 * @param first Первое событие.
 * @param second Второе событие.
 */
export function compareChatEvents(
  first: ChatFeedEvent,
  second: ChatFeedEvent,
): number {
  const byTime =
    new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();

  if (byTime) {
    return byTime;
  }

  return first.id.localeCompare(second.id);
}
