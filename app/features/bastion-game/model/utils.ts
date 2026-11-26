import type { BastionDataKind, MenagerieSizeCode } from './constants';
import type {
  GamePlayer,
  PlayerBastion,
  PlayerBastionMemberRequest,
  PlayerBastionStatus,
} from './schema';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import { fillTemplate } from '~bastions/model';

import {
  ARTISAN_TOOL_ICONS,
  BASTION_DATA_KEYS,
  BASTION_FACILITIES_ROUTE,
  BASTION_FORM_LABELS,
  BASTION_NAME_MAX_LENGTH,
  BASTION_PLAN_ROUTE_SUFFIX,
  BASTION_START_LEVEL,
  BESTIARY_ROUTE,
  FACILITY_CHOICES_SEPARATOR,
  FACILITY_SETUP_LABELS,
  GAMES_ROUTE,
  LAST_TURN_HIDDEN_STORAGE_KEY,
  MAGIC_ITEMS_ROUTE,
  MENAGERIE_LARGE_SPACE,
  MENAGERIE_MEDIUM_SPACE,
  MY_BASTIONS_ROUTE,
  QUARTER_FRACTIONS,
  SHARED_BASTION_ROUTE,
  STABLE_LARGE_SPACE,
  STABLE_MEDIUM_SPACE,
} from './constants';

const SERVICE_UNAVAILABLE_STATUS = StatusCodes.SERVICE_UNAVAILABLE;
const CONFLICT_STATUS = StatusCodes.CONFLICT;

/** Строка формы доступа: игрок игры и его персонаж в бастионе. */
export interface BastionMemberDraft {
  userId: string;
  selected: boolean;
  characterName: string;
  characterLevel: number;
}

/**
 * Собирает строки формы доступа: нынешний состав бастиона отмечен и несёт
 * своих персонажей, остальные игроки игры — с именем персонажа из заявки и
 * стартовым уровнем бастиона. Вне игры игроков нет, и в форме только состав.
 *
 * @param players Игроки игры с одобренной заявкой.
 * @param bastion Редактируемый бастион.
 * @returns Строки формы: сначала состав, затем игроки игры.
 */
export function createMemberDrafts(
  players: ReadonlyArray<GamePlayer>,
  bastion?: PlayerBastion,
): Array<BastionMemberDraft> {
  const members = bastion?.members ?? [];
  const memberIds = new Set(members.map((member) => member.userId));

  // Сначала нынешний состав — в нём бывают не игроки игры (владелец-мастер
  // или участник из времени до игры), затем остальные игроки игры.
  return [
    ...members.map((member) => ({
      userId: member.userId,
      selected: true,
      characterName: member.characterName,
      characterLevel: member.characterLevel,
    })),
    ...players
      .filter((player) => !memberIds.has(player.userId))
      .map((player) => ({
        userId: player.userId,
        selected: false,
        characterName: player.characterName ?? '',
        characterLevel: BASTION_START_LEVEL,
      })),
  ];
}

/**
 * Превращает отмеченные строки формы в состав бастиона для запроса.
 *
 * @param drafts Строки формы доступа.
 * @returns Игроки с доступом.
 */
export function toMemberRequests(
  drafts: ReadonlyArray<BastionMemberDraft>,
): Array<PlayerBastionMemberRequest> {
  return drafts
    .filter((draft) => draft.selected)
    .map((draft) => ({
      userId: draft.userId,
      characterName: draft.characterName.trim(),
      characterLevel: draft.characterLevel,
    }));
}

/**
 * Находит исходную ошибку запроса: `useAsyncData` оборачивает её в ошибку
 * Nuxt, и ответ сервера остаётся в `cause`.
 *
 * @param error Ошибка из `$fetch` или `useAsyncData`.
 * @returns Ошибка запроса или undefined.
 */
function findFetchError(error: unknown): FetchError | undefined {
  if (error instanceof FetchError) {
    return error;
  }

  if (error instanceof Error && error.cause instanceof FetchError) {
    return error.cause;
  }

  return undefined;
}

/**
 * Отказ из-за устаревшей версии: данные уже изменил кто-то другой.
 *
 * @param error Ошибка запроса.
 * @returns true для ответа 409.
 */
export function isBastionConflictError(error: unknown): boolean {
  return findFetchError(error)?.statusCode === CONFLICT_STATUS;
}

/**
 * Достаёт объяснение ошибки из ответа core-api. На 4xx в `message` лежит
 * текст для пользователя («Бастион уже изменили…»). На 503 — тоже: его отдаёт
 * сам core-api, когда не отвечает каталог игр. Остальные 5xx несут технический
 * текст (SQL, стек), его заменяет общая формулировка.
 *
 * @param error Ошибка запроса.
 * @param fallback Общая формулировка.
 * @returns Текст для пользователя.
 */
export function getBastionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const fetchError = findFetchError(error);

  if (!fetchError) {
    return fallback;
  }

  const status = fetchError.statusCode ?? 0;
  const message: unknown = fetchError.data?.message;

  const isReadable =
    (status >= 400 && status < 500) || status === SERVICE_UNAVAILABLE_STATUS;

  if (isReadable && typeof message === 'string' && message) {
    return message;
  }

  return fallback;
}

/**
 * Показывать ли статус бастиона: «Действует» — обычное состояние, бастион
 * действует сразу после создания, поэтому отмечаются только закладка и архив.
 *
 * @param status Статус бастиона.
 * @returns true для закладки и архива.
 */
export function isBastionStatusShown(status: PlayerBastionStatus): boolean {
  return status !== 'ACTIVE';
}

/**
 * Страница бастиона — одна для своих бастионов и для бастионов в игре.
 *
 * @param id Бастион.
 * @returns Путь страницы.
 */
export function getBastionRoute(id: string): string {
  return `${MY_BASTIONS_ROUTE}/${id}`;
}

/**
 * Страница плана бастиона.
 *
 * @param id Бастион.
 * @returns Путь страницы.
 */
export function getBastionPlanRoute(id: string): string {
  return `${getBastionRoute(id)}${BASTION_PLAN_ROUTE_SUFFIX}`;
}

/**
 * Страница бастиона по ссылке «поделиться».
 *
 * @param token Секрет ссылки.
 * @returns Путь страницы.
 */
export function getSharedBastionRoute(token: string): string {
  return `${SHARED_BASTION_ROUTE}/${token}`;
}

/**
 * План бастиона по ссылке «поделиться».
 *
 * @param token Секрет ссылки.
 * @returns Путь страницы.
 */
export function getSharedBastionPlanRoute(token: string): string {
  return `${getSharedBastionRoute(token)}${BASTION_PLAN_ROUTE_SUFFIX}`;
}

/**
 * Страница игры, в которую добавлен бастион.
 *
 * @param gameId Игра каталога.
 * @returns Путь страницы.
 */
export function getGameRoute(gameId: string): string {
  return `${GAMES_ROUTE}/${gameId}`;
}

/**
 * Ключ `useAsyncData` для данных бастиона: страницы с одинаковым ключом
 * делят кеш.
 *
 * @param kind Что грузится.
 * @param id Бастион или токен ссылки «поделиться».
 * @returns Ключ вида `player-bastion-<id>`.
 */
export function getBastionDataKey(kind: BastionDataKind, id: string): string {
  return `${BASTION_DATA_KEYS[kind]}-${id}`;
}

/**
 * Карточка сооружения бастиона в справочнике.
 *
 * @param url Адрес сооружения в каталоге.
 * @returns Путь страницы.
 */
export function getBastionFacilityRoute(url: string): string {
  return `${BASTION_FACILITIES_ROUTE}/${url}`;
}

/**
 * Карточка магического предмета в справочнике.
 *
 * @param url Адрес предмета в каталоге.
 * @returns Путь страницы.
 */
export function getMagicItemRoute(url: string): string {
  return `${MAGIC_ITEMS_ROUTE}/${url}`;
}

/**
 * Карточка существа в бестиарии.
 *
 * @param url Адрес существа в каталоге.
 * @returns Путь страницы.
 */
export function getBestiaryRoute(url: string): string {
  return `${BESTIARY_ROUTE}/${url}`;
}

/**
 * Ключ хранилища со скрытым ходом: свой у каждого бастиона.
 *
 * @param bastionId Бастион.
 * @returns Ключ в формате `bastion-game:last-turn-hidden:<id>`.
 */
export function getLastTurnHiddenKey(bastionId: string): string {
  return `${LAST_TURN_HIDDEN_STORAGE_KEY}:${bastionId}`;
}

/**
 * Значок инструмента ремесленника по его названию.
 *
 * @param name Название варианта выбора: «Инструменты кузнеца».
 * @returns Значок или undefined, если это не инструмент ремесленника.
 */
export function getArtisanToolIcon(name: string): string | undefined {
  const lower = name.toLowerCase();

  return ARTISAN_TOOL_ICONS.find(([stem]) => lower.includes(stem))?.[1];
}

/**
 * Место в вольерах зверинца в больших существах: 9 четвертей → «2¼».
 *
 * @param quarters Место в четвертях большого существа.
 * @returns Число больших мест с дробью.
 */
export function formatMenagerieSpace(quarters: number): string {
  const whole = Math.floor(quarters / MENAGERIE_LARGE_SPACE);
  const fraction = QUARTER_FRACTIONS[quarters % MENAGERIE_LARGE_SPACE] ?? '';

  if (!whole && fraction) {
    return fraction;
  }

  return `${whole}${fraction}`;
}

/**
 * Место в конюшне в больших животных: 5 половин → «2½».
 *
 * @param halves Место в половинах большого животного.
 * @returns Число больших мест с дробью.
 */
export function formatStableSpace(halves: number): string {
  return formatMenagerieSpace(
    (halves * MENAGERIE_LARGE_SPACE) / STABLE_LARGE_SPACE,
  );
}

/**
 * Сколько платит покупатель за животное из конюшни: обычная цена с наценкой,
 * с округлением вниз — так же считает сервер.
 *
 * @param cost Обычная цена, зм.
 * @param bonusPercent Наценка, процентов.
 * @returns Цена продажи, зм.
 */
export function getStableSalePrice(cost: number, bonusPercent: number): number {
  return Math.floor((cost * (100 + bonusPercent)) / 100);
}

/**
 * Сколько места в вольерах займёт существо этого размера.
 *
 * @param size Размер существа.
 * @returns Место в четвертях большого существа.
 */
export function getMenagerieSpace(size: MenagerieSizeCode): number {
  return size === 'LARGE' ? MENAGERIE_LARGE_SPACE : MENAGERIE_MEDIUM_SPACE;
}

/**
 * Сколько места в конюшне займёт животное этого размера.
 *
 * @param size Размер животного.
 * @returns Место в половинах большого животного.
 */
export function getStableSpace(size: MenagerieSizeCode): number {
  return size === 'LARGE' ? STABLE_LARGE_SPACE : STABLE_MEDIUM_SPACE;
}

/**
 * Выбор инструментов ремесленников: каждый выбранный вариант узнаётся как
 * инструмент.
 *
 * @param options Выбранные варианты.
 * @returns true, если все варианты — инструменты.
 */
export function isArtisanToolChoice(options: ReadonlyArray<string>): boolean {
  return (
    options.length > 0
    && options.every((option) => !!getArtisanToolIcon(option))
  );
}

/**
 * Выборы сооружения, кроме инструментов, одной строкой.
 *
 * @param choices Выборы сооружения: название и выбранные варианты.
 * @returns «Сад: травы; Библиотека: история».
 */
export function formatFacilityChoices(
  choices: ReadonlyArray<{ name: string; options: Array<string> }>,
): string {
  return choices
    .filter((choice) => !isArtisanToolChoice(choice.options))
    .map((choice) =>
      fillTemplate(FACILITY_SETUP_LABELS.choiceTerms, {
        name: choice.name,
        options: choice.options.join(', '),
      }),
    )
    .join(FACILITY_CHOICES_SEPARATOR);
}

/**
 * Пространство сооружения с площадью.
 *
 * @param space Пространство: название и площадь в квадратах.
 * @param space.name Название пространства.
 * @param space.squares Площадь, 5-футовых квадратов.
 * @returns «Тесное (4 кв.)».
 */
export function formatFacilitySpace(space: {
  name: string;
  squares: number;
}): string {
  return fillTemplate(FACILITY_SETUP_LABELS.spaceTerms, {
    name: space.name,
    squares: space.squares,
    unit: FACILITY_SETUP_LABELS.squares,
  });
}

/**
 * Название бастиона подходит: не пустое и не длиннее положенного.
 *
 * @param name Введённое название.
 * @returns true, если название можно сохранить.
 */
export function isBastionNameValid(name: string): boolean {
  const trimmed = name.trim();

  return trimmed.length > 0 && trimmed.length <= BASTION_NAME_MAX_LENGTH;
}

/**
 * Подсказка к уровню персонажа. Ниже 5 уровня бастиона по правилам ещё нет —
 * форма только предупреждает.
 *
 * @param level Уровень персонажа.
 * @returns Текст предупреждения или undefined.
 */
export function getBastionLevelHint(level: number): string | undefined {
  return level < BASTION_START_LEVEL
    ? BASTION_FORM_LABELS.belowStartLevel
    : undefined;
}

/**
 * Подсказка к уровню в строке формы доступа: только у отмеченного игрока.
 *
 * @param draft Строка формы доступа.
 * @returns Текст предупреждения или undefined.
 */
export function getMemberLevelHint(
  draft: BastionMemberDraft,
): string | undefined {
  return draft.selected ? getBastionLevelHint(draft.characterLevel) : undefined;
}

/**
 * Можно ли распоряжаться действующим бастионом: ведущий или игрок с правом
 * отдавать приказы.
 *
 * @param bastion Бастион.
 * @returns true, если бастион действует и приказы кому-то доступны.
 */
export function canGiveBastionOrders(bastion: PlayerBastion): boolean {
  return (
    bastion.status === 'ACTIVE'
    && (bastion.canManage
      || bastion.members.some((member) => member.canGiveOrders))
  );
}
