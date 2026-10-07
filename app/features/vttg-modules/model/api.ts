import type {
  ModuleSubmission,
  SubmissionRequest,
  SubmissionsPage,
  SubmissionStatus,
  VttgGameSystem,
} from './types';

import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

import {
  APPROVE_PATH_SUFFIX,
  REFRESH_MANIFEST_PATH_SUFFIX,
  REJECT_PATH_SUFFIX,
  VTTG_MODULES_MODERATION_API_PATH,
  VTTG_MODULES_MY_SUBMISSIONS_API_PATH,
  VTTG_MODULES_SESSION_EXPIRED_MESSAGE,
  VTTG_MODULES_SUBMISSIONS_API_PATH,
  VTTG_MODULES_SYSTEMS_API_PATH,
  VTTG_MODULES_UNKNOWN_ERROR_MESSAGE,
} from './constants';
import {
  moderationCommentSchema,
  parseGameSystems,
  parseProblemMessage,
  parseSubmission,
  parseSubmissions,
  parseSubmissionsPage,
  prepareSubmissionRequest,
} from './schemas';

type Fetcher = ReturnType<typeof useRequestFetch>;

/**
 * Путь заявки автора.
 * @param submissionId Идентификатор заявки.
 */
function submissionPath(submissionId: string): string {
  return `${VTTG_MODULES_SUBMISSIONS_API_PATH}/${encodeURIComponent(submissionId)}`;
}

/**
 * Путь действия модератора над заявкой.
 * @param submissionId Идентификатор заявки.
 * @param action Хвост пути действия.
 */
function moderationActionPath(submissionId: string, action: string): string {
  return `${VTTG_MODULES_MODERATION_API_PATH}/${encodeURIComponent(submissionId)}/${action}`;
}

/**
 * Человекочитаемое сообщение об ошибке реестра. Сервис отвечает по RFC 7807,
 * и готовый русский текст лежит в `detail`.
 * @param error Пойманная ошибка.
 */
export function getVttgModulesErrorMessage(error: unknown): string {
  if (!(error instanceof FetchError)) {
    return VTTG_MODULES_UNKNOWN_ERROR_MESSAGE;
  }

  const message = parseProblemMessage(error.data);

  if (message) {
    return message;
  }

  // Отказ без тела (401 от сервиса, сбой прокси) объясняем сами: текст
  // `FetchError` — метод, путь и статус, человеку он ни о чём не говорит.
  if (
    (error.statusCode ?? error.response?.status) === StatusCodes.UNAUTHORIZED
  ) {
    return VTTG_MODULES_SESSION_EXPIRED_MESSAGE;
  }

  return VTTG_MODULES_UNKNOWN_ERROR_MESSAGE;
}

/**
 * Загружает справочник игровых систем для формы заявки.
 * @param fetcher Функция запроса; на сервере — с cookie текущего запроса.
 */
export async function fetchGameSystems(
  fetcher: Fetcher = $fetch,
): Promise<Array<VttgGameSystem>> {
  const response = await fetcher(VTTG_MODULES_SYSTEMS_API_PATH, { retry: 0 });

  return parseGameSystems(response);
}

/**
 * Загружает свои заявки, новые сверху.
 * @param fetcher Функция запроса; на сервере — с cookie текущего запроса.
 */
export async function fetchMySubmissions(
  fetcher: Fetcher = $fetch,
): Promise<Array<ModuleSubmission>> {
  const response = await fetcher(VTTG_MODULES_MY_SUBMISSIONS_API_PATH, {
    retry: 0,
  });

  return parseSubmissions(response);
}

/**
 * Подаёт заявку. Сервис сразу скачивает и проверяет `module.json`, поэтому
 * отказ может прийти из-за манифеста — его текст лежит в ответе.
 * @param request Данные формы.
 */
export async function createSubmission(
  request: SubmissionRequest,
): Promise<ModuleSubmission> {
  const response = await $fetch(VTTG_MODULES_SUBMISSIONS_API_PATH, {
    method: 'POST',
    body: prepareSubmissionRequest(request),
    retry: 0,
  });

  return parseSubmission(response);
}

/**
 * Исправляет заявку и отправляет её на повторное рассмотрение.
 * @param submissionId Идентификатор заявки.
 * @param request Данные формы.
 */
export async function resubmitSubmission(
  submissionId: string,
  request: SubmissionRequest,
): Promise<ModuleSubmission> {
  const response = await $fetch(submissionPath(submissionId), {
    method: 'PUT',
    body: prepareSubmissionRequest(request),
    retry: 0,
  });

  return parseSubmission(response);
}

/**
 * Перечитывает `module.json`: новая версия и архив без повторной модерации.
 * @param submissionId Идентификатор заявки.
 */
export async function refreshSubmissionManifest(
  submissionId: string,
): Promise<ModuleSubmission> {
  const response = await $fetch(
    `${submissionPath(submissionId)}/${REFRESH_MANIFEST_PATH_SUFFIX}`,
    { method: 'POST', retry: 0 },
  );

  return parseSubmission(response);
}

/**
 * Отзывает заявку; одобренный модуль пропадает из каталога.
 * @param submissionId Идентификатор заявки.
 */
export async function withdrawSubmission(submissionId: string): Promise<void> {
  await $fetch(submissionPath(submissionId), { method: 'DELETE', retry: 0 });
}

/**
 * Загружает страницу очереди модерации, старые заявки сверху.
 * @param status Статус заявок; `null` — все.
 * @param page Номер страницы, считая с нуля.
 * @param size Размер страницы.
 * @param fetcher Функция запроса; на сервере — с cookie текущего запроса.
 */
export async function fetchModerationSubmissions(
  status: SubmissionStatus | null,
  page: number,
  size: number,
  fetcher: Fetcher = $fetch,
): Promise<SubmissionsPage> {
  const response = await fetcher(VTTG_MODULES_MODERATION_API_PATH, {
    query: { status: status ?? undefined, page, size },
    retry: 0,
  });

  return parseSubmissionsPage(response);
}

/**
 * Одобряет заявку — модуль появляется в каталоге VTTG.
 * @param submissionId Идентификатор заявки.
 * @param comment Необязательный комментарий автору.
 */
export async function approveSubmission(
  submissionId: string,
  comment: string,
): Promise<ModuleSubmission> {
  const response = await $fetch(
    moderationActionPath(submissionId, APPROVE_PATH_SUFFIX),
    {
      method: 'POST',
      body: { comment: moderationCommentSchema.parse(comment) || null },
      retry: 0,
    },
  );

  return parseSubmission(response);
}

/**
 * Отклоняет заявку или снимает одобренный модуль из каталога.
 * @param submissionId Идентификатор заявки.
 * @param comment Причина — её увидит автор.
 */
export async function rejectSubmission(
  submissionId: string,
  comment: string,
): Promise<ModuleSubmission> {
  const response = await $fetch(
    moderationActionPath(submissionId, REJECT_PATH_SUFFIX),
    {
      method: 'POST',
      body: { comment: moderationCommentSchema.min(1).parse(comment) },
      retry: 0,
    },
  );

  return parseSubmission(response);
}
