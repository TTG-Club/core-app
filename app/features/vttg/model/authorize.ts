import type { LocationQuery } from 'vue-router';

import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

/**
 * Вход в мир VTTG через аккаунт TTG Club.
 *
 * Мир работает на машине мастера, поэтому пароль человек вводит только здесь,
 * на сайте. Мир присылает его на страницу согласия, а обратно получает справку:
 * id и ник, ничего больше. Справка живёт минуту и годится лишь для адреса мира,
 * который человек видел на этой странице.
 */

/** Путь страницы согласия — на него мир отправляет игрока. */
export const VTTG_AUTHORIZE_PATH = '/vttg/authorize';

/** Роут сайта, выдающий справку для мира. */
export const VTTG_AUTHORIZE_ENDPOINT = '/api/vttg/authorize';

/**
 * Имена параметров во фрагменте адреса, с которым человек возвращается в мир.
 * Фрагмент на сервер не уходит: справку увидит только страница мира.
 * Значения синхронны с клиентом VTTG — менять только вместе с ним.
 */
export const VTTG_AUTHORIZE_RETURN_PARAMS = {
  ticket: 'ttg-ticket',
  state: 'ttg-state',
  denied: 'ttg-denied',
} as const;

/** Заголовок и описание страницы для вкладки браузера. */
export const VTTG_AUTHORIZE_SEO = {
  title: 'Вход в мир — Virtual TTG Club',
  description:
    'Подтверждение входа в игровой мир Virtual TTG Club через аккаунт TTG Club.',
  // Страница служебная и открывается только по ссылке из мира — в поиске ей
  // делать нечего.
  robots: 'noindex, nofollow',
} as const;

/** Заголовок и подзаголовок страницы. */
export const VTTG_AUTHORIZE_PAGE = {
  title: 'Вход в мир',
  subtitle: 'Virtual TTG Club',
} as const;

/** Тексты карточки согласия. */
export const VTTG_AUTHORIZE_TEXT = {
  question: 'Мир хочет узнать, кто вы',
  worldNameLabel: 'Называет себя',
  worldAddressLabel: 'Адрес мира',
  accountLabel: 'Вы войдёте как',
  sharedTitle: 'Мир узнает только ваш ник',
  sharedDescription:
    'Пароль, почта и доступ к аккаунту миру не передаются. Действовать от вашего имени на сайте он не сможет.',
  warningTitle: 'Проверьте адрес',
  warningDescription:
    'Разрешайте вход, только если вы сами нажали «Войти через TTG Club» в мире по этому адресу. Название мир придумывает себе сам — доверяйте адресу, а не названию.',
  allowLabel: 'Разрешить',
  cancelLabel: 'Отмена',
  signInPrompt: 'Войдите в аккаунт TTG Club, чтобы продолжить.',
  signInLabel: 'Войти в аккаунт',
  accountPending: 'Загружаем аккаунт…',
} as const;

/** Иконки карточки согласия. */
export const VTTG_AUTHORIZE_ICONS = {
  world: 'tabler:world',
  account: 'tabler:user',
  shared: 'tabler:shield-check',
  warning: 'tabler:alert-triangle',
  allow: 'tabler:check',
  signIn: 'tabler:login-2',
  invalid: 'tabler:link-off',
} as const;

/** Ссылка на страницу согласия повреждена или неполна. */
export const VTTG_AUTHORIZE_INVALID = {
  title: 'Ссылка не подходит',
  description:
    'Вернитесь в мир и нажмите «Войти через TTG Club» ещё раз — страница откроется с правильной ссылкой.',
} as const;

/** Сообщения об ошибках выдачи справки. */
export const VTTG_AUTHORIZE_ERRORS = {
  title: 'Не получилось войти',
  unavailable:
    'Вход через аккаунт сейчас недоступен. Попробуйте позже или войдите в мир по паролю мира.',
  sessionExpired: 'Сессия на сайте истекла. Войдите в аккаунт ещё раз.',
  badAddress: 'Мир прислал некорректный адрес. Сообщите об этом мастеру.',
  tooManyRequests:
    'Слишком много попыток. Подождите минуту и попробуйте снова.',
} as const;

/** Значение признака отказа во фрагменте адреса возврата. */
const RETURN_DENIED_VALUE = '1';

/** Наибольшая длина названия мира в ссылке — оно только показывается. */
const WORLD_NAME_MAX_LENGTH = 80;

/** Наибольшая длина метки запроса, которую мир проверяет при возврате. */
const STATE_MAX_LENGTH = 128;

/** Схемы адреса, с которыми мир может работать. */
const WORLD_PROTOCOLS: ReadonlyArray<string> = ['http:', 'https:'];

/** Запрос входа, разобранный из ссылки мира. */
export interface VttgAuthorizeRequest {
  /** Адрес мира: схема, хост и порт без пути */
  worldOrigin: string;
  /** Название, которым мир себя представил; может отсутствовать */
  worldName: string;
  /** Метка запроса — возвращается миру как есть */
  state: string;
}

const authorizeQuerySchema = z.object({
  world: z.string().min(1).max(255),
  name: z.string().trim().max(WORLD_NAME_MAX_LENGTH).optional(),
  state: z.string().min(1).max(STATE_MAX_LENGTH),
});

/**
 * Проверяет, что строка — адрес мира без пути, параметров и учётных данных.
 *
 * Адрес показывается человеку как то, чему он доверяет, и на него же уходит
 * справка. Всё, кроме схемы, хоста и порта, в нём лишнее: путь или параметры
 * позволили бы спрятать за знакомым хостом чужую страницу.
 *
 * @param value Адрес из ссылки мира.
 */
function parseWorldOrigin(value: string): string | undefined {
  if (!URL.canParse(value)) {
    return undefined;
  }

  const url = new URL(value);

  const isPlainOrigin =
    WORLD_PROTOCOLS.includes(url.protocol)
    && !url.username
    && !url.password
    && !url.search
    && !url.hash
    && (url.pathname === '/' || url.pathname === '');

  return isPlainOrigin ? url.origin : undefined;
}

/**
 * Берёт единственное строковое значение параметра ссылки.
 *
 * @param value Значение из `route.query`.
 */
function readQueryString(
  value: LocationQuery[string] | undefined,
): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Разбирает запрос входа из ссылки, с которой мир прислал человека.
 *
 * @param query Параметры адреса страницы согласия.
 */
export function parseVttgAuthorizeQuery(
  query: LocationQuery,
): VttgAuthorizeRequest | undefined {
  const parsedQuery = authorizeQuerySchema.safeParse({
    world: readQueryString(query.world),
    name: readQueryString(query.name),
    state: readQueryString(query.state),
  });

  if (!parsedQuery.success) {
    return undefined;
  }

  const worldOrigin = parseWorldOrigin(parsedQuery.data.world);

  if (!worldOrigin) {
    return undefined;
  }

  return {
    worldOrigin,
    worldName: parsedQuery.data.name ?? '',
    state: parsedQuery.data.state,
  };
}

/**
 * Собирает адрес возврата в мир со справкой.
 *
 * @param request Запрос входа из ссылки мира.
 * @param ticket Справка о личности.
 */
export function buildVttgAuthorizeReturnUrl(
  request: VttgAuthorizeRequest,
  ticket: string,
): string {
  const fragment = new URLSearchParams({
    [VTTG_AUTHORIZE_RETURN_PARAMS.ticket]: ticket,
    [VTTG_AUTHORIZE_RETURN_PARAMS.state]: request.state,
  });

  return `${request.worldOrigin}/#${fragment.toString()}`;
}

/**
 * Собирает адрес возврата в мир при отказе.
 *
 * @param request Запрос входа из ссылки мира.
 */
export function buildVttgAuthorizeCancelUrl(
  request: VttgAuthorizeRequest,
): string {
  const fragment = new URLSearchParams({
    [VTTG_AUTHORIZE_RETURN_PARAMS.denied]: RETURN_DENIED_VALUE,
    [VTTG_AUTHORIZE_RETURN_PARAMS.state]: request.state,
  });

  return `${request.worldOrigin}/#${fragment.toString()}`;
}

/**
 * Подбирает сообщение об ошибке выдачи справки по коду ответа.
 *
 * @param status Код ответа роута справки.
 */
export function describeVttgAuthorizeError(status: number | undefined): string {
  switch (status) {
    case StatusCodes.BAD_REQUEST:
      return VTTG_AUTHORIZE_ERRORS.badAddress;
    case StatusCodes.UNAUTHORIZED:
      return VTTG_AUTHORIZE_ERRORS.sessionExpired;
    case StatusCodes.TOO_MANY_REQUESTS:
      return VTTG_AUTHORIZE_ERRORS.tooManyRequests;
    default:
      return VTTG_AUTHORIZE_ERRORS.unavailable;
  }
}
