import { FIND_GAME_API_PREFIX } from '#shared/consts';

/* ------------------------------------------------------------------ */
/* Маршруты сайта                                                      */
/* ------------------------------------------------------------------ */

/** Список комнат пользователя. */
export const NEXUS_ROUTE = '/nexus';

/**
 * Адрес комнаты.
 * @param nexusId Идентификатор комнаты.
 */
export function getNexusRoute(nexusId: string): string {
  return `${NEXUS_ROUTE}/${nexusId}`;
}

/**
 * Ссылка-приглашение: по ней входят в комнату.
 * @param inviteCode Код приглашения.
 */
export function getNexusInviteRoute(inviteCode: string): string {
  return `${NEXUS_ROUTE}/join/${inviteCode}`;
}

/* ------------------------------------------------------------------ */
/* Адреса сервиса                                                      */
/* ------------------------------------------------------------------ */

export const NEXUSES_PATH = `${FIND_GAME_API_PREFIX}/nexuses`;

/**
 * Адрес комнаты в сервисе.
 * @param nexusId Идентификатор комнаты.
 */
export function nexusPath(nexusId: string): string {
  return `${NEXUSES_PATH}/${nexusId}`;
}

/**
 * Комната игры: живёт под адресом игры, потому что попасть в неё можно
 * только оттуда.
 * @param gameId Идентификатор игры.
 */
export function gameNexusPath(gameId: string): string {
  return `${FIND_GAME_API_PREFIX}/games/${gameId}/nexus`;
}

/** Сколько комнат просим за раз. */
export const NEXUS_PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/* Подписи                                                             */
/* ------------------------------------------------------------------ */

export const NEXUS_NAVIGATION_LABEL = 'Нексус';
export const NEXUS_LIST_TITLE = 'Мои комнаты';

export const NEXUS_LIST_DESCRIPTION =
  'Игровая комната группы: чат, листы персонажей, инициатива и добыча.';

export const NEXUS_CREATE_LABEL = 'Новая комната';
export const NEXUS_CREATE_TITLE = 'Новая игровая комната';
export const NEXUS_TITLE_LABEL = 'Название';
export const NEXUS_TITLE_PLACEHOLDER = 'Стол по вторникам';
export const NEXUS_TITLE_MAX_LENGTH = 150;
export const NEXUS_CREATED_TOAST = 'Комната создана';

export const NEXUS_EMPTY_TITLE = 'Комнат пока нет';
export const NEXUS_EMPTY_DESCRIPTION =
  'Создайте комнату для своей группы или войдите в чужую по ссылке.';

export const NEXUS_ERROR_TITLE = 'Не удалось загрузить комнаты';
export const NEXUS_NOT_FOUND_TITLE = 'Комната не найдена';

export const NEXUS_NOT_FOUND_DESCRIPTION = 'Её удалили или вас в неё не звали.';

export const NEXUS_MEMBERS_LABEL = 'Участники';
export const NEXUS_MEMBERS_COUNT_LABEL = 'Участников';
export const NEXUS_OWNER_LABEL = 'Владелец';
export const NEXUS_GAME_ROOM_LABEL = 'Комната игры';

export const NEXUS_GAME_ROOM_HINT =
  'Состав определяют заявки в игру: принимают и исключают на её странице.';

export const NEXUS_INVITE_LABEL = 'Ссылка-приглашение';

export const NEXUS_INVITE_HINT = 'Перешедший по ссылке войдёт в комнату сам.';

export const NEXUS_INVITE_COPY_LABEL = 'Скопировать ссылку';
export const NEXUS_INVITE_COPIED_TOAST = 'Ссылка скопирована';
export const NEXUS_JOIN_TITLE = 'Входим в комнату';
export const NEXUS_JOIN_FAILED_TITLE = 'Не удалось войти по ссылке';
export const NEXUS_JOINED_TOAST = 'Вы вошли в комнату';
export const NEXUS_LEAVE_LABEL = 'Покинуть комнату';
export const NEXUS_LEFT_TOAST = 'Вы вышли из комнаты';
export const NEXUS_EVICT_LABEL = 'Вывести';
export const NEXUS_EVICTED_TOAST = 'Участник выведен из комнаты';
export const NEXUS_OPEN_LABEL = 'Открыть комнату';

/** Заглушка имени, когда core-api не вернул отображаемое имя участника. */
export const NEXUS_UNKNOWN_MEMBER_NAME = 'Участник';

/* Листы персонажей комнаты. */
export const NEXUS_SHEETS_TITLE = 'Листы персонажей';
export const NEXUS_SHEET_ADD_LABEL = 'Добавить лист';
export const NEXUS_SHEET_ADD_TITLE = 'Лист персонажа в комнату';

export const NEXUS_SHEET_SHARE_HINT =
  'Лист откроется всем в комнате по ссылке общего доступа.';

export const NEXUS_SHEET_OWN_TAB = 'Мои листы';
export const NEXUS_SHEET_OTHERS_TAB = 'Другие листы';
export const NEXUS_SHEET_EMPTY_TITLE = 'Листов пока нет';

export const NEXUS_SHEET_UNAVAILABLE_HINT =
  'Доступ к листу закрыт: владелец отозвал ссылку.';

export const NEXUS_SHEETS_EMPTY_TITLE = 'В комнате пока нет персонажей';

export const NEXUS_SHEETS_EMPTY_DESCRIPTION =
  'Добавьте лист — его увидит вся группа.';

export const NEXUS_SHEET_OPEN_LABEL = 'Открыть лист';
export const NEXUS_SHEET_REMOVE_LABEL = 'Убрать';
export const NEXUS_SHEET_TRANSFER_LABEL = 'Передать';
export const NEXUS_SHEET_TRANSFER_TITLE = 'Кому передать лист';

export const NEXUS_SHEET_TRANSFER_HINT =
  'Новый владелец сможет убрать лист из комнаты.';

export const NEXUS_SHEET_ADDED_TOAST = 'Лист добавлен в комнату';
export const NEXUS_SHEET_REMOVED_TOAST = 'Лист убран из комнаты';
export const NEXUS_SHEET_TRANSFERRED_TOAST = 'Лист передан';

/* Идущий бой комнаты. */
export const NEXUS_FIGHT_ROUND_LABEL = 'Раунд';
export const NEXUS_FIGHT_HINT = 'Бой ведёт мастер — очередь ходов идёт сюда';

/* Трекеры инициативы комнаты. */
export const NEXUS_TRACKERS_TITLE = 'Бои';
export const NEXUS_TRACKER_CREATE_LABEL = 'Новый бой';
export const NEXUS_TRACKER_CREATE_TITLE = 'Новый бой в комнате';

export const NEXUS_TRACKER_CREATE_HINT =
  'Персонажи со стола встанут в бой сразу — остальных добавите в самом трекере.';

export const NEXUS_TRACKER_TITLE_LABEL = 'Название';
export const NEXUS_TRACKER_TITLE_PLACEHOLDER = 'Засада у моста';
export const NEXUS_TRACKER_TITLE_MAX_LENGTH = 150;
export const NEXUS_TRACKER_OPEN_LABEL = 'Открыть бой';
export const NEXUS_TRACKER_REMOVE_LABEL = 'Убрать';
export const NEXUS_TRACKERS_EMPTY_TITLE = 'Боёв пока нет';

export const NEXUS_TRACKERS_EMPTY_DESCRIPTION =
  'Мастер поставит бой, когда дойдёт до схватки.';

export const NEXUS_TRACKER_CREATED_TOAST = 'Бой поставлен';
export const NEXUS_TRACKER_REMOVED_TOAST = 'Бой убран из комнаты';

export const NEXUS_UNKNOWN_ERROR_MESSAGE = 'Что-то пошло не так';
