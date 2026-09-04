import type {
  CityOption,
  FindGameNotification,
  FindGameProblemDetail,
  FindGameUserProfile,
  Game,
  GameRegistration,
  GameSession,
  MasterPublicProfile,
  SessionParticipant,
  SpringPage,
} from './types';

import { z } from '~/utils/zod';

import {
  GAME_AGE_MAX,
  GAME_AGE_MIN,
  GAME_ALLOWED_SOURCE_MAX_LENGTH,
  GAME_ALLOWED_SOURCES_MAX_COUNT,
  GAME_CITY_MAX_LENGTH,
  GAME_COST_TYPES,
  GAME_DESCRIPTION_MAX_LENGTH,
  GAME_DURATION_TYPES,
  GAME_GENRE_MAX_LENGTH,
  GAME_PLAYERS_MAX,
  GAME_PLAYERS_MIN,
  GAME_REQUIREMENTS_MAX_LENGTH,
  GAME_SESSION_STATUSES,
  GAME_STARTING_LEVEL_MAX,
  GAME_STARTING_LEVEL_MIN,
  GAME_STATUSES,
  GAME_SYSTEMS,
  GAME_TITLE_MAX_LENGTH,
  GAME_TYPES,
  GAME_URL_MAX_LENGTH,
  GAME_VENUE_MAX_LENGTH,
  GAME_VISIBILITIES,
  NOTIFICATION_TYPES,
  PROFILE_ABOUT_MAX_LENGTH,
  PROFILE_BIRTH_YEAR_MAX,
  PROFILE_BIRTH_YEAR_MIN,
  PROFILE_EXPERIENCE_MAX,
  PROFILE_EXPERIENCE_MIN,
  PROFILE_GENDERS,
  SESSION_ATTENDANCE_STATUSES,
  SESSION_PAYMENT_TYPES,
  SESSION_REGISTRATION_STATUSES,
} from './constants';

/* ------------------------------------------------------------------ */
/* Примитивы                                                           */
/* ------------------------------------------------------------------ */

/**
 * Момент времени от сервиса. Jackson отдаёт `Instant` ISO-строкой, но при смене
 * настроек сериализации он может приехать числом (миллисекунды epoch), поэтому
 * оба варианта приводятся к ISO-строке. Непригодное значение становится пустой
 * строкой — дата просто не показывается, а форма значения пишется в консоль,
 * чтобы изменение контракта не потерялось молча.
 * @param value Сырое значение из ответа сервиса.
 */
function normalizeInstant(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (value != null) {
    consola.warn('[find-game] Неизвестный формат даты от сервиса:', value);
  }

  return '';
}

/**
 * `.optional()` здесь обязателен: `z.unknown()` с `transform` внутри объекта
 * считается обязательным ключом, и ответ без него не разбирается целиком.
 * А сервис ключи как раз опускает — `@JsonInclude(NON_NULL)` вырезает `paidAt`
 * у неоплаченной заявки и `availableAt` у любого отказа, кроме 429.
 */
const instantSchema = z.unknown().optional().transform(normalizeInstant);

const nullableInstantSchema = z
  .unknown()
  .optional()
  .transform((value) => (value == null ? null : normalizeInstant(value)));

const uuidSchema = z.string().min(1);

/**
 * Число от сервиса. `BigDecimal` Jackson отдаёт числом, но при
 * `WRITE_BIGDECIMAL_AS_PLAIN` — строкой, поэтому принимаем оба варианта.
 */
const decimalSchema = z.coerce.number().finite();

/* ------------------------------------------------------------------ */
/* Профиль мастера                                                     */
/* ------------------------------------------------------------------ */

const masterProfileResponseSchema = z.object({
  userId: uuidSchema,
  about: z.string().nullish().catch(null),
  tabletopExperienceYears: z.coerce.number().int().nullish().catch(null),
  recruitingGames: z.coerce.number().int().catch(0),
  closedGames: z.coerce.number().int().catch(0),
  cancelledGames: z.coerce.number().int().catch(0),
  completedSessions: z.coerce.number().int().catch(0),
});

/**
 * Разбирает публичный профиль мастера.
 * @param input Сырой ответ сервиса.
 */
export function parseMasterProfile(input: unknown): MasterPublicProfile {
  const parsed = masterProfileResponseSchema.parse(input);

  return {
    userId: parsed.userId,
    about: parsed.about ?? null,
    tabletopExperienceYears: parsed.tabletopExperienceYears ?? null,
    recruitingGames: parsed.recruitingGames,
    closedGames: parsed.closedGames,
    cancelledGames: parsed.cancelledGames,
    completedSessions: parsed.completedSessions,
  };
}

/* ------------------------------------------------------------------ */
/* Справочник городов                                                  */
/* ------------------------------------------------------------------ */

const cityResponseSchema = z.object({
  name: z.string().min(1),
  region: z.string().nullish().catch(null),
  country: z.string().catch(''),
});

/**
 * Разбирает подсказки городов. Битая запись выкидывается по одной: из-за неё
 * список подсказок не должен пропадать целиком.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseCities(input: unknown): Array<CityOption> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = cityResponseSchema.safeParse(item);

    return parsed.success
      ? [
          {
            name: parsed.data.name,
            region: parsed.data.region ?? null,
            country: parsed.data.country,
          },
        ]
      : [];
  });
}

/* ------------------------------------------------------------------ */
/* Игра                                                                */
/* ------------------------------------------------------------------ */

const gameResponseSchema = z.object({
  // Без идентификаторов запись бесполезна: по ним строятся ссылки и права.
  id: uuidSchema,
  masterId: uuidSchema,
  title: z.string().catch(''),
  system: z.enum(GAME_SYSTEMS).catch('DND_2024'),
  imageUrl: z.string().nullish().catch(null),
  virtualTableUrl: z.string().nullish().catch(null),
  masterChatUrl: z.string().nullish().catch(null),
  gameChatUrl: z.string().nullish().catch(null),
  genre: z.string().nullish().catch(null),
  description: z.string().catch(''),
  requirements: z.string().catch(''),
  allowedSources: z.array(z.string()).nullish().catch(null),
  type: z.enum(GAME_TYPES).catch('ONLINE'),
  city: z.string().nullish().catch(null),
  venue: z.string().nullish().catch(null),
  playersToStart: z.coerce.number().int().catch(GAME_PLAYERS_MIN),
  maxPlayers: z.coerce.number().int().catch(GAME_PLAYERS_MIN),
  // Занятые места ближайшей сессии. Сборки сервиса без этого подсчёта поля
  // не отдают — тогда карточка показывает пустые места, а не ломается.
  takenSeats: z.coerce.number().int().nullish().catch(null),
  approvedSeats: z.coerce.number().int().nullish().catch(null),
  minAge: z.coerce.number().int().nullish().catch(null),
  maxAge: z.coerce.number().int().nullish().catch(null),
  startingLevel: z.coerce.number().int().catch(GAME_STARTING_LEVEL_MIN),
  crossplayAllowed: z.boolean().catch(false),
  recruitmentClosed: z.boolean().catch(false),
  status: z.enum(GAME_STATUSES).catch('OPEN'),
  durationType: z.enum(GAME_DURATION_TYPES).catch('CAMPAIGN'),
  costType: z.enum(GAME_COST_TYPES).catch('FREE'),
  visibility: z.enum(GAME_VISIBILITIES).catch('PUBLIC'),
  // Публичные ответы код приглашения вырезают — здесь он появляется только
  // при создании игры и в собственной выдаче мастера.
  inviteCode: z.string().nullish().catch(null),
  createdAt: instantSchema,
  // Поле сборок сервиса с поднятием игр: на старой сборке его просто нет.
  listPositionAt: nullableInstantSchema,
  updatedAt: instantSchema,
});

/**
 * Приводит разобранный ответ к доменной игре: `null` вместо `undefined` и
 * массив источников вместо необязательного поля.
 * @param parsed Результат разбора ответа сервиса.
 */
function toGame(parsed: z.infer<typeof gameResponseSchema>): Game {
  return {
    id: parsed.id,
    masterId: parsed.masterId,
    title: parsed.title,
    system: parsed.system,
    imageUrl: parsed.imageUrl ?? null,
    virtualTableUrl: parsed.virtualTableUrl ?? null,
    masterChatUrl: parsed.masterChatUrl ?? null,
    gameChatUrl: parsed.gameChatUrl ?? null,
    genre: parsed.genre ?? null,
    description: parsed.description,
    requirements: parsed.requirements,
    allowedSources: parsed.allowedSources ?? [],
    type: parsed.type,
    city: parsed.city ?? null,
    venue: parsed.venue ?? null,
    playersToStart: parsed.playersToStart,
    maxPlayers: parsed.maxPlayers,
    takenSeats: parsed.takenSeats ?? 0,
    approvedSeats: parsed.approvedSeats ?? 0,
    minAge: parsed.minAge ?? null,
    maxAge: parsed.maxAge ?? null,
    startingLevel: parsed.startingLevel,
    crossplayAllowed: parsed.crossplayAllowed,
    recruitmentClosed: parsed.recruitmentClosed,
    status: parsed.status,
    durationType: parsed.durationType,
    costType: parsed.costType,
    visibility: parsed.visibility,
    inviteCode: parsed.inviteCode ?? null,
    createdAt: parsed.createdAt,
    listPositionAt: parsed.listPositionAt,
    updatedAt: parsed.updatedAt,
  };
}

/**
 * Разбирает одну игру.
 * @param input Сырой ответ сервиса.
 */
export function parseGame(input: unknown): Game {
  return toGame(gameResponseSchema.parse(input));
}

/**
 * Разбирает список игр поэлементно: битая запись выкидывается по одной и
 * сообщается в консоль. `catch` на всём массиве отдал бы пустой каталог из-за
 * одной игры без идентификатора — на экране это выглядит как «ничего не
 * нашлось» при непустом счётчике.
 * @param input Сырой массив из ответа сервиса.
 */
function parseGameList(input: unknown): Array<Game> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = gameResponseSchema.safeParse(item);

    if (!parsed.success) {
      consola.warn('[find-game] Игра не прошла разбор:', item);

      return [];
    }

    return [toGame(parsed.data)];
  });
}

/** Счётчики страницы: сколько всего, какая по счёту и какого размера. */
const pageMetaSchema = z.object({
  totalElements: z.coerce.number().catch(0),
  totalPages: z.coerce.number().catch(0),
  number: z.coerce.number().catch(0),
  size: z.coerce.number().catch(0),
});

/**
 * Схема страницы Spring-пагинации.
 *
 * Счётчики читаются из двух мест: Spring Boot 4 отдаёт их вложенным объектом
 * `page`, а прежние сборки клали те же поля рядом с `content`. Разбирать нужно
 * оба вида — иначе на одной из версий сервиса каталог показывает «0 игр» и
 * никогда не рисует пагинацию, хотя игры на экране есть.
 *
 * `first` и `last` в новой форме не приходят вовсе, поэтому выводятся из
 * номера страницы и их общего числа.
 *
 * @param parseContent Разбор содержимого страницы.
 */
function createPageSchema<Item>(parseContent: (input: unknown) => Array<Item>) {
  return z
    .object({
      content: z.unknown().transform(parseContent),
      page: pageMetaSchema.nullish(),
      totalElements: z.coerce.number().nullish().catch(null),
      totalPages: z.coerce.number().nullish().catch(null),
      number: z.coerce.number().nullish().catch(null),
      size: z.coerce.number().nullish().catch(null),
    })
    .transform((parsed) => {
      const meta = parsed.page;

      const totalElements = meta?.totalElements ?? parsed.totalElements ?? 0;
      const totalPages = meta?.totalPages ?? parsed.totalPages ?? 0;
      const number = meta?.number ?? parsed.number ?? 0;
      const size = meta?.size ?? parsed.size ?? 0;

      return {
        content: parsed.content,
        totalElements,
        totalPages,
        number,
        size,
        first: number <= 0,
        last: totalPages === 0 || number >= totalPages - 1,
      };
    })
    .catch({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 0,
      first: true,
      last: true,
    });
}

const gamesPageSchema = createPageSchema(parseGameList);

/**
 * Разбирает страницу игр.
 * @param input Сырой ответ сервиса.
 */
export function parseGamesPage(input: unknown): SpringPage<Game> {
  return gamesPageSchema.parse(input);
}

/* ------------------------------------------------------------------ */
/* Сессии                                                              */
/* ------------------------------------------------------------------ */

const gameSessionResponseSchema = z.object({
  id: uuidSchema,
  gameId: uuidSchema,
  title: z.string().catch(''),
  // Пусто у набора с открытой датой — мастер назначит время после набора.
  startsAt: nullableInstantSchema,
  estimatedDurationMinutes: z.coerce.number().int().nullish().catch(null),
  status: z.enum(GAME_SESSION_STATUSES).catch('SCHEDULED'),
  priceAmount: decimalSchema.nullish().catch(null),
  priceCurrency: z.string().nullish().catch(null),
  paymentType: z.enum(SESSION_PAYMENT_TYPES).nullish().catch(null),
  registeredPlayerIds: z.array(z.string()).nullish().catch(null),
});

/**
 * Приводит разобранный ответ к доменной сессии.
 * @param parsed Результат разбора ответа сервиса.
 */
function toGameSession(
  parsed: z.infer<typeof gameSessionResponseSchema>,
): GameSession {
  return {
    id: parsed.id,
    gameId: parsed.gameId,
    title: parsed.title,
    startsAt: parsed.startsAt,
    estimatedDurationMinutes: parsed.estimatedDurationMinutes ?? null,
    status: parsed.status,
    priceAmount: parsed.priceAmount ?? null,
    priceCurrency: parsed.priceCurrency ?? null,
    paymentType: parsed.paymentType ?? null,
    registeredPlayerIds: parsed.registeredPlayerIds ?? [],
  };
}

/**
 * Разбирает одну сессию.
 * @param input Сырой ответ сервиса.
 */
export function parseGameSession(input: unknown): GameSession {
  return toGameSession(gameSessionResponseSchema.parse(input));
}

/**
 * Разбирает список сессий, отсеивая битые записи поштучно.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseGameSessions(input: unknown): Array<GameSession> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = gameSessionResponseSchema.safeParse(item);

    if (!parsed.success) {
      consola.warn('[find-game] Сессия не прошла разбор:', item);

      return [];
    }

    return [toGameSession(parsed.data)];
  });
}

/* ------------------------------------------------------------------ */
/* Заявки                                                              */
/* ------------------------------------------------------------------ */

const gameRegistrationResponseSchema = z.object({
  id: uuidSchema,
  gameId: uuidSchema,
  playerId: uuidSchema,
  characterSheetUrl: z.string().nullish().catch(null),
  characterName: z.string().nullish().catch(null),
  status: z.enum(SESSION_REGISTRATION_STATUSES).catch('PENDING'),
  rejectionReason: z.string().nullish().catch(null),
  createdAt: instantSchema,
  updatedAt: instantSchema,
});

/**
 * Приводит заявку к доменному виду.
 * @param parsed Результат разбора ответа сервиса.
 */
function toGameRegistration(
  parsed: z.infer<typeof gameRegistrationResponseSchema>,
): GameRegistration {
  return {
    id: parsed.id,
    gameId: parsed.gameId,
    playerId: parsed.playerId,
    characterSheetUrl: parsed.characterSheetUrl ?? null,
    characterName: parsed.characterName ?? null,
    status: parsed.status,
    rejectionReason: parsed.rejectionReason ?? null,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
  };
}

/**
 * Разбирает одну заявку.
 * @param input Сырой ответ сервиса.
 */
export function parseGameRegistration(input: unknown): GameRegistration {
  return toGameRegistration(gameRegistrationResponseSchema.parse(input));
}

/**
 * Разбирает список заявок, отсеивая битые записи поштучно.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseGameRegistrations(
  input: unknown,
): Array<GameRegistration> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = gameRegistrationResponseSchema.safeParse(item);

    if (!parsed.success) {
      consola.warn('[find-game] Заявка не прошла разбор:', item);

      return [];
    }

    return [toGameRegistration(parsed.data)];
  });
}

const sessionParticipantResponseSchema = z.object({
  id: uuidSchema,
  sessionId: uuidSchema,
  playerId: uuidSchema,
  attendanceStatus: z.enum(SESSION_ATTENDANCE_STATUSES).nullish().catch(null),
  paid: z.boolean().catch(false),
  paidAt: nullableInstantSchema,
  createdAt: instantSchema,
  updatedAt: instantSchema,
});

/**
 * Приводит участие к доменному виду.
 * @param parsed Результат разбора ответа сервиса.
 */
function toSessionParticipant(
  parsed: z.infer<typeof sessionParticipantResponseSchema>,
): SessionParticipant {
  return {
    id: parsed.id,
    sessionId: parsed.sessionId,
    playerId: parsed.playerId,
    attendanceStatus: parsed.attendanceStatus ?? null,
    paid: parsed.paid,
    paidAt: parsed.paidAt,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
  };
}

/**
 * Разбирает одно участие.
 * @param input Сырой ответ сервиса.
 */
export function parseSessionParticipant(input: unknown): SessionParticipant {
  return toSessionParticipant(sessionParticipantResponseSchema.parse(input));
}

/**
 * Разбирает состав сессии, отсеивая битые записи поштучно.
 * @param input Сырой массив из ответа сервиса.
 */
export function parseSessionParticipants(
  input: unknown,
): Array<SessionParticipant> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = sessionParticipantResponseSchema.safeParse(item);

    if (!parsed.success) {
      consola.warn('[find-game] Участие не прошло разбор:', item);

      return [];
    }

    return [toSessionParticipant(parsed.data)];
  });
}

/* ------------------------------------------------------------------ */
/* Уведомления                                                         */
/* ------------------------------------------------------------------ */

const notificationResponseSchema = z.object({
  id: uuidSchema,
  type: z.enum(NOTIFICATION_TYPES),
  gameId: uuidSchema,
  gameTitle: z.string().catch(''),
  sessionId: uuidSchema.nullish().catch(null),
  sessionTitle: z.string().nullish().catch(null),
  readAt: nullableInstantSchema,
  createdAt: instantSchema,
});

/**
 * Приводит уведомление к доменному виду.
 * @param parsed Результат разбора ответа сервиса.
 */
function toNotification(
  parsed: z.infer<typeof notificationResponseSchema>,
): FindGameNotification {
  return {
    id: parsed.id,
    type: parsed.type,
    gameId: parsed.gameId,
    gameTitle: parsed.gameTitle,
    sessionId: parsed.sessionId ?? null,
    sessionTitle: parsed.sessionTitle ?? null,
    readAt: parsed.readAt,
    createdAt: parsed.createdAt,
  };
}

/**
 * Разбирает одно уведомление.
 * @param input Сырой ответ сервиса.
 */
export function parseNotification(input: unknown): FindGameNotification {
  return toNotification(notificationResponseSchema.parse(input));
}

/**
 * Разбирает список уведомлений, отсеивая битые записи поштучно: одно
 * непонятное уведомление не должно ронять всю ленту.
 * @param input Сырой массив из ответа сервиса.
 */
function parseNotificationList(input: unknown): Array<FindGameNotification> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    const parsed = notificationResponseSchema.safeParse(item);

    if (!parsed.success) {
      consola.warn('[find-game] Уведомление не прошло разбор:', item);

      return [];
    }

    return [toNotification(parsed.data)];
  });
}

const notificationsPageSchema = createPageSchema(parseNotificationList);

/**
 * Разбирает страницу уведомлений.
 * @param input Сырой ответ сервиса.
 */
export function parseNotificationsPage(
  input: unknown,
): SpringPage<FindGameNotification> {
  return notificationsPageSchema.parse(input);
}

const unreadNotificationsSchema = z.object({
  unread: z.coerce.number().int().catch(0),
});

/**
 * Разбирает счётчик непрочитанных.
 * @param input Сырой ответ сервиса.
 */
export function parseUnreadNotifications(input: unknown): number {
  return unreadNotificationsSchema.parse(input).unread;
}

/* ------------------------------------------------------------------ */
/* Профиль                                                             */
/* ------------------------------------------------------------------ */

const userProfileResponseSchema = z.object({
  userId: uuidSchema,
  birthYear: z.coerce.number().int().nullish().catch(null),
  gender: z.enum(PROFILE_GENDERS).nullish().catch(null),
  tabletopExperienceYears: z.coerce.number().int().nullish().catch(null),
  master: z.object({ about: z.string().nullish().catch(null) }).nullish(),
  player: z.object({ about: z.string().nullish().catch(null) }).nullish(),
  createdAt: instantSchema,
  updatedAt: instantSchema,
});

/**
 * Разбирает профиль поиска игр. Две анкеты независимы, поэтому пустой `about`
 * одной из них не должен ронять разбор второй.
 * @param input Сырой ответ сервиса.
 */
export function parseFindGameProfile(input: unknown): FindGameUserProfile {
  const parsed = userProfileResponseSchema.parse(input);

  return {
    userId: parsed.userId,
    birthYear: parsed.birthYear ?? null,
    gender: parsed.gender ?? null,
    tabletopExperienceYears: parsed.tabletopExperienceYears ?? null,
    masterAbout: parsed.master?.about ?? '',
    playerAbout: parsed.player?.about ?? '',
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Тела запросов                                                       */
/* ------------------------------------------------------------------ */

/** Необязательная строка: пустая и пробельная превращаются в `undefined`. */
function optionalTrimmed(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();
}

export const createGameRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(GAME_TITLE_MAX_LENGTH),
    system: z.enum(GAME_SYSTEMS),
    imageUrl: optionalTrimmed(GAME_URL_MAX_LENGTH),
    virtualTableUrl: optionalTrimmed(GAME_URL_MAX_LENGTH),
    masterChatUrl: optionalTrimmed(GAME_URL_MAX_LENGTH),
    gameChatUrl: optionalTrimmed(GAME_URL_MAX_LENGTH),
    genre: optionalTrimmed(GAME_GENRE_MAX_LENGTH),
    description: z.string().trim().min(1).max(GAME_DESCRIPTION_MAX_LENGTH),
    requirements: z.string().trim().min(1).max(GAME_REQUIREMENTS_MAX_LENGTH),
    allowedSources: z
      .array(z.string().trim().min(1).max(GAME_ALLOWED_SOURCE_MAX_LENGTH))
      .max(GAME_ALLOWED_SOURCES_MAX_COUNT)
      .optional(),
    type: z.enum(GAME_TYPES),
    city: optionalTrimmed(GAME_CITY_MAX_LENGTH),
    venue: optionalTrimmed(GAME_VENUE_MAX_LENGTH),
    playersToStart: z
      .number()
      .int()
      .min(GAME_PLAYERS_MIN)
      .max(GAME_PLAYERS_MAX),
    maxPlayers: z.number().int().min(GAME_PLAYERS_MIN).max(GAME_PLAYERS_MAX),
    minAge: z.number().int().min(GAME_AGE_MIN).max(GAME_AGE_MAX).optional(),
    maxAge: z.number().int().min(GAME_AGE_MIN).max(GAME_AGE_MAX).optional(),
    startingLevel: z
      .number()
      .int()
      .min(GAME_STARTING_LEVEL_MIN)
      .max(GAME_STARTING_LEVEL_MAX),
    crossplayAllowed: z.boolean(),
    durationType: z.enum(GAME_DURATION_TYPES),
    costType: z.enum(GAME_COST_TYPES),
    visibility: z.enum(GAME_VISIBILITIES),
  })
  .check((context) => {
    const game = context.value;

    if (game.playersToStart > game.maxPlayers) {
      context.issues.push({
        code: 'custom',
        input: game.playersToStart,
        path: ['playersToStart'],
        message: 'Для старта нужно не больше игроков, чем максимум',
      });
    }

    if (
      game.minAge != null
      && game.maxAge != null
      && game.minAge > game.maxAge
    ) {
      context.issues.push({
        code: 'custom',
        input: game.minAge,
        path: ['minAge'],
        message: 'Минимальный возраст не может превышать максимальный',
      });
    }

    // Город — признак офлайн-игры: сервис отвергает его у ONLINE, а у TEXT
    // он смысла не имеет, поэтому и там не пропускаем.
    if (game.type !== 'OFFLINE' && game.city) {
      context.issues.push({
        code: 'custom',
        input: game.city,
        path: ['city'],
        message: 'Город указывается только для игр вживую',
      });
    }
  });

export const findGameProfileRequestSchema = z.object({
  birthYear: z
    .number()
    .int()
    .min(PROFILE_BIRTH_YEAR_MIN)
    .max(PROFILE_BIRTH_YEAR_MAX)
    .nullable(),
  gender: z.enum(PROFILE_GENDERS),
  tabletopExperienceYears: z
    .number()
    .int()
    .min(PROFILE_EXPERIENCE_MIN)
    .max(PROFILE_EXPERIENCE_MAX)
    .nullable(),
  master: z.object({ about: z.string().max(PROFILE_ABOUT_MAX_LENGTH) }),
  player: z.object({ about: z.string().max(PROFILE_ABOUT_MAX_LENGTH) }),
});

/* ------------------------------------------------------------------ */
/* ProblemDetail                                                       */
/* ------------------------------------------------------------------ */

const problemDetailSchema = z.object({
  type: z.string().nullish().catch(null),
  title: z.string().nullish().catch(null),
  status: z.coerce.number().nullish().catch(null),
  detail: z.string().nullish().catch(null),
  errors: z.record(z.string(), z.string()).nullish().catch(null),
  availableAt: nullableInstantSchema,
});

/**
 * Разбирает тело ошибки сервиса. Тело может быть чем угодно (пустым, HTML от
 * прокси), поэтому разбор не бросает — вызывающий получит пустой
 * `ProblemDetail` и покажет общий текст.
 * @param input Сырое тело ответа с ошибкой.
 */
export function parseProblemDetail(input: unknown): FindGameProblemDetail {
  const parsed = problemDetailSchema.safeParse(input);

  if (!parsed.success) {
    return {
      type: null,
      title: null,
      status: null,
      detail: null,
      errors: null,
      availableAt: null,
    };
  }

  return {
    type: parsed.data.type ?? null,
    title: parsed.data.title ?? null,
    status: parsed.data.status ?? null,
    detail: parsed.data.detail ?? null,
    errors: parsed.data.errors ?? null,
    availableAt: parsed.data.availableAt,
  };
}

/**
 * Разбирает ответ core-api с отображаемыми именами участников.
 * Резолв — вспомогательный: битый ответ не должен ронять страницу игры,
 * поэтому вместо исключения возвращается пустой список, и участники
 * подписываются заглушкой.
 * @param input Сырой ответ core-api.
 */
export function parseParticipantNames(
  input: unknown,
): Array<{ userId: string; displayName: string }> {
  const parsed = z
    .array(
      z.object({ userId: z.string().min(1), displayName: z.string().min(1) }),
    )
    .safeParse(input);

  return parsed.success ? parsed.data : [];
}
