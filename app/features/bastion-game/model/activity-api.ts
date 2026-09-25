import type {
  BastionActivity,
  BastionOrderCode,
  FacilityOrderOptionDetail,
  FacilitySpaceCode,
  PlayerBastion,
  SelectedChoice,
} from './schema';

import { PLAYER_BASTIONS_API_PATH } from './constants';
import {
  bastionActivitySchema,
  facilityDetailSchema,
  playerBastionSchema,
} from './schema';

/** Адрес ручки бастиона. */
function bastionPath(bastionId: string, suffix: string): string {
  return `${PLAYER_BASTIONS_API_PATH}/${bastionId}${suffix}`;
}

/**
 * Отправляет правку бастиона и разбирает ответ — бастион после правки.
 *
 * @param path Адрес ручки.
 * @param method Метод.
 * @param body Тело запроса.
 * @returns Бастион после правки.
 */
async function mutateBastion(
  path: string,
  method: 'POST' | 'DELETE',
  body?: Record<string, unknown>,
): Promise<PlayerBastion> {
  const response = await $fetch<unknown>(path, { method, body, retry: 0 });

  return playerBastionSchema.parse(response);
}

/**
 * Журналы бастиона: приказы, ходы и казна.
 *
 * @param bastionId Бастион.
 * @returns Журналы, свежие первыми.
 */
export async function fetchBastionActivity(
  bastionId: string,
): Promise<BastionActivity> {
  const response = await $fetch<unknown>(bastionPath(bastionId, '/activity'), {
    method: 'GET',
    retry: 0,
  });

  return bastionActivitySchema.parse(response);
}

/**
 * Варианты приказов сооружения из справочника.
 *
 * @param facilityUrl Сооружение справочника.
 * @returns Варианты приказов.
 */
export async function fetchFacilityOrderOptions(
  facilityUrl: string,
): Promise<Array<FacilityOrderOptionDetail>> {
  const response = await $fetch<unknown>(`/api/v2/bastions/${facilityUrl}`, {
    method: 'GET',
    retry: 0,
  });

  return facilityDetailSchema.parse(response).orderOptions ?? [];
}

/**
 * Отдаёт приказ сооружению или всему бастиону («Обслуживать» — без сооружения).
 *
 * @param bastionId Бастион.
 * @param request Сооружение, приказ, вариант и пояснение.
 * @param request.facilityId Сооружение; пусто — «Обслуживать».
 * @param request.order Приказ.
 * @param request.optionName Вариант приказа.
 * @param request.note Пояснение.
 * @returns Бастион после приказа.
 */
export function giveBastionOrder(
  bastionId: string,
  request: {
    facilityId?: string;
    order: BastionOrderCode;
    optionName?: string;
    note?: string;
  },
): Promise<PlayerBastion> {
  return mutateBastion(bastionPath(bastionId, '/orders'), 'POST', request);
}

/**
 * Отменяет приказ текущего хода; цена возвращается в казну.
 *
 * @param bastionId Бастион.
 * @param orderId Приказ.
 * @returns Бастион после отмены.
 */
export function cancelBastionOrder(
  bastionId: string,
  orderId: string,
): Promise<PlayerBastion> {
  return mutateBastion(bastionPath(bastionId, `/orders/${orderId}`), 'DELETE');
}

/**
 * Делает ход бастиона. Только мастер.
 *
 * @param bastionId Бастион.
 * @param request Событие бастиона и итоги завершающихся приказов.
 * @param request.event Событие при обслуживании.
 * @param request.results Итоги приказов: приказ → текст.
 * @returns Бастион после хода.
 */
export function performBastionTurn(
  bastionId: string,
  request: { event?: string; results: Record<string, string> },
): Promise<PlayerBastion> {
  return mutateBastion(bastionPath(bastionId, '/turns'), 'POST', request);
}

/**
 * Пополняет или списывает казну. Только мастер.
 *
 * @param bastionId Бастион.
 * @param amountGp Плюс — пополнение, минус — списание.
 * @param note За что.
 * @returns Бастион после движения казны.
 */
export function adjustBastionTreasury(
  bastionId: string,
  amountGp: number,
  note?: string,
): Promise<PlayerBastion> {
  return mutateBastion(bastionPath(bastionId, '/treasury'), 'POST', {
    amountGp,
    note,
  });
}

/**
 * Строит базовое сооружение за деньги и время из правил.
 *
 * @param bastionId Бастион.
 * @param memberId Персонаж.
 * @param facilityUrl Базовое сооружение справочника.
 * @param space Пространство.
 * @returns Бастион после начала стройки.
 */
export function buildBasicFacility(
  bastionId: string,
  memberId: string,
  facilityUrl: string,
  space: FacilitySpaceCode,
): Promise<PlayerBastion> {
  return mutateBastion(
    bastionPath(bastionId, `/members/${memberId}/facilities/basic`),
    'POST',
    { facilityUrl, space },
  );
}

/**
 * Добавляет специализированное сооружение, полученное с уровнем.
 *
 * @param bastionId Бастион.
 * @param memberId Персонаж.
 * @param facilityUrl Сооружение справочника.
 * @param choices Выборы сооружения.
 * @returns Бастион с новым сооружением.
 */
export function addSpecialFacility(
  bastionId: string,
  memberId: string,
  facilityUrl: string,
  choices: Array<SelectedChoice>,
): Promise<PlayerBastion> {
  return mutateBastion(
    bastionPath(bastionId, `/members/${memberId}/facilities/special`),
    'POST',
    { facilityUrl, choices },
  );
}

/**
 * Начинает расширение сооружения.
 *
 * @param bastionId Бастион.
 * @param facilityId Сооружение персонажа.
 * @returns Бастион после начала расширения.
 */
export function enlargeFacility(
  bastionId: string,
  facilityId: string,
): Promise<PlayerBastion> {
  return mutateBastion(
    bastionPath(bastionId, `/facilities/${facilityId}/enlarge`),
    'POST',
  );
}

/**
 * Убирает сооружение. Только мастер.
 *
 * @param bastionId Бастион.
 * @param facilityId Сооружение персонажа.
 * @returns Бастион без сооружения.
 */
export function removeBastionFacility(
  bastionId: string,
  facilityId: string,
): Promise<PlayerBastion> {
  return mutateBastion(
    bastionPath(bastionId, `/facilities/${facilityId}`),
    'DELETE',
  );
}
