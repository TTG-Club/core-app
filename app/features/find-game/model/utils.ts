import type { Game, GameSession, Reputation } from './types';

import {
  GAME_TYPE_LABELS,
  GAMES_ROUTE,
  INVITE_CODE_QUERY_KEY,
  REPUTATION_EMPTY_LABEL,
  REVIEW_WINDOW_DAYS,
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
 * Занятость числом — для большого состава, где значки игроков уже не
 * читаются и не рисуются. Ряд мест не должен оставаться пустым: без него
 * непонятно, набрана группа или нет.
 *
 * @param game Игра.
 */
export function getGameSeatsCounter(game: Game): string {
  return `${game.takenSeats} / ${game.maxPlayers}`;
}

/**
 * Закрыт ли набор в игру. Полный стол закрыт и без отметки мастера: свободного
 * места в нём нет, и заявку туда всё равно не примут.
 *
 * @param game Игра.
 */
export function isGameRecruitmentClosed(game: Game): boolean {
  return game.recruitmentClosed || game.takenSeats >= game.maxPlayers;
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

/** Миллисекунд в минуте — для перевода паузы ожидания. */
const MILLIS_IN_MINUTE = 60_000;

/**
 * Сколько ждать до следующей попытки: «через 5 часов», «через 12 минут».
 *
 * Сервис отвечает моментом, с которого попытка снова разрешена, но человеку
 * нужен не момент, а срок: дату из отказа читать неудобно, тем более в UTC.
 *
 * @param availableAt Момент, с которого попытка снова разрешена.
 * @returns Подпись срока; `null` — ждать уже нечего.
 */
export function getWaitLabel(availableAt: string): string | null {
  const millis = new Date(availableAt).getTime() - Date.now();

  if (!Number.isFinite(millis) || millis <= 0) {
    return null;
  }

  // Округляем вверх: «через 0 минут» на живой паузе выглядит обманом.
  const minutes = Math.ceil(millis / MILLIS_IN_MINUTE);

  if (minutes < MINUTES_IN_HOUR) {
    return `${minutes} ${getPlural(minutes, ['минуту', 'минуты', 'минут'])}`;
  }

  const hours = Math.ceil(minutes / MINUTES_IN_HOUR);

  return `${hours} ${getPlural(hours, ['час', 'часа', 'часов'])}`;
}

/** Миллисекунд в сутках — для окна на оценку встречи. */
const MILLIS_IN_DAY = 24 * MINUTES_IN_HOUR * MILLIS_IN_MINUTE;

/**
 * Подпись репутации: «11 из 12 сыграли бы снова».
 *
 * Доля, а не средний балл: оценка бинарная, и доля читается точнее любого
 * числа с запятой.
 *
 * @param reputation Репутация участника; `null` — ещё не загружена.
 */
export function getReputationLabel(reputation: Reputation | null): string {
  if (!reputation || reputation.total <= 0) {
    return REPUTATION_EMPTY_LABEL;
  }

  return `${reputation.recommended} из ${reputation.total} сыграли бы снова`;
}

/**
 * Открыто ли окно на оценку встречи.
 *
 * Считается по отметке завершения — той же, по которой окно закрывает сервис.
 * Встречи, закрытые до появления оценок, отметки не имеют и оценке не
 * подлежат.
 *
 * @param session Встреча.
 */
export function isSessionReviewable(session: GameSession): boolean {
  if (session.status !== 'COMPLETED' || !session.completedAt) {
    return false;
  }

  const closesAt =
    new Date(session.completedAt).getTime()
    + REVIEW_WINDOW_DAYS * MILLIS_IN_DAY;

  return Number.isFinite(closesAt) && closesAt > Date.now();
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
