import type { BadgeProps } from '@nuxt/ui';

import type { SubmissionStatus } from './types';

import { VTTG_MODULES_API_PREFIX } from '#shared/consts';

/* ------------------------------------------------------------------ */
/* Маршруты и пути API                                                 */
/* ------------------------------------------------------------------ */

/** Страница автора: свои заявки на модули. */
export const VTTG_MODULES_ROUTE = '/vttg/modules';

/** Очередь модерации заявок на модули. */
export const VTTG_MODULES_MODERATION_ROUTE = '/moderation/vttg-modules';

/** Справочник игровых систем для формы заявки. */
export const VTTG_MODULES_SYSTEMS_API_PATH = `${VTTG_MODULES_API_PREFIX}/systems`;

/** Заявки автора. */
export const VTTG_MODULES_SUBMISSIONS_API_PATH = `${VTTG_MODULES_API_PREFIX}/submissions`;

/** Свои заявки автора. */
export const VTTG_MODULES_MY_SUBMISSIONS_API_PATH = `${VTTG_MODULES_SUBMISSIONS_API_PATH}/my`;

/** Очередь модерации. */
export const VTTG_MODULES_MODERATION_API_PATH = `${VTTG_MODULES_API_PREFIX}/moderation/submissions`;

/** Хвост пути перечитывания манифеста. */
export const REFRESH_MANIFEST_PATH_SUFFIX = 'refresh-manifest';

/** Хвост пути одобрения заявки. */
export const APPROVE_PATH_SUFFIX = 'approve';

/** Хвост пути отклонения заявки. */
export const REJECT_PATH_SUFFIX = 'reject';

/* ------------------------------------------------------------------ */
/* Ограничения полей — те же, что у сервиса                            */
/* ------------------------------------------------------------------ */

/** Длина ссылки на репозиторий и манифест. */
export const SUBMISSION_URL_MAX_LENGTH = 2048;

/** Длина краткого описания модуля. */
export const SUBMISSION_DESCRIPTION_MAX_LENGTH = 1000;

/** Сколько систем можно указать в заявке. */
export const SUBMISSION_SYSTEMS_MAX_COUNT = 20;

/** Начальная высота полей описания и причины отклонения, в строках. */
export const TEXTAREA_ROWS = 4;

/** Длина комментария модератора. */
export const MODERATION_COMMENT_MAX_LENGTH = 2000;

/** Заявок на странице очереди модерации. */
export const MODERATION_PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/* Статусы                                                             */
/* ------------------------------------------------------------------ */

/** Все статусы заявки в порядке жизненного цикла. */
export const SUBMISSION_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
] as const;

/** Подписи статусов. */
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрен',
  REJECTED: 'Отклонён',
  WITHDRAWN: 'Отозван',
};

/** Цвета значков статусов. */
export const SUBMISSION_STATUS_COLORS: Record<
  SubmissionStatus,
  NonNullable<BadgeProps['color']>
> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  WITHDRAWN: 'neutral',
};

/** Статусы, которые автор может исправить и отправить заново. */
export const EDITABLE_STATUSES: ReadonlyArray<SubmissionStatus> = [
  'PENDING',
  'REJECTED',
];

/** Статус, с которого открывается очередь модерации. */
export const DEFAULT_MODERATION_STATUS: SubmissionStatus = 'PENDING';

/* ------------------------------------------------------------------ */
/* Тексты страницы автора                                              */
/* ------------------------------------------------------------------ */

export const VTTG_MODULES_TITLE = 'Мои модули VTTG';

/** Значок раздела в меню профиля. */
export const VTTG_MODULES_ICON = 'tabler:puzzle';

export const VTTG_MODULES_DESCRIPTION =
  'Модули разрабатываются в открытых репозиториях. Подайте заявку — после одобрения модуль появится в каталоге VTTG, и его можно будет установить в любой мир.';

export const VTTG_MODULES_REQUIREMENTS_TITLE = 'Что нужно для заявки';

/** Требования к модулю, которые сервис проверяет при подаче. */
export const VTTG_MODULES_REQUIREMENTS = [
  'Открытый репозиторий на GitHub, GitLab, Codeberg, GitFlic или GitVerse.',
  'Файл module.json с полями id, name, version и download — ссылкой на архив модуля.',
  'id — строчные латинские буквы, цифры, «-» и «_»; он же имя папки модуля в мире.',
] as const;

export const SUBMIT_LABEL = 'Подать заявку';

export const SUBMIT_ICON = 'tabler:plus';

export const SUBMISSIONS_EMPTY_TITLE = 'Заявок пока нет';

export const SUBMISSIONS_EMPTY_DESCRIPTION =
  'Подайте первую заявку — модератор рассмотрит её и ответит здесь же.';

export const SUBMISSIONS_LOAD_ERROR_TITLE = 'Не удалось загрузить заявки';

export const RETRY_LABEL = 'Повторить';

/* ------------------------------------------------------------------ */
/* Форма заявки                                                        */
/* ------------------------------------------------------------------ */

export const FORM_CREATE_TITLE = 'Заявка на модуль';

export const FORM_EDIT_TITLE = 'Исправить заявку';

export const FORM_EDIT_HINT =
  'После правки заявка снова уйдёт на рассмотрение.';

export const FORM_REPOSITORY_LABEL = 'Репозиторий';

export const FORM_REPOSITORY_PLACEHOLDER = 'https://github.com/автор/модуль';

export const FORM_MANIFEST_LABEL = 'Ссылка на module.json';

export const FORM_MANIFEST_PLACEHOLDER =
  'https://github.com/автор/модуль/blob/main/module.json';

export const FORM_MANIFEST_HINT =
  'Подойдёт и ссылка на страницу файла в GitHub — сервис сам возьмёт его содержимое.';

export const FORM_SYSTEMS_LABEL = 'Игровые системы';

export const FORM_SYSTEMS_PLACEHOLDER = 'Любая система';

export const FORM_SYSTEMS_HINT =
  'Оставьте пустым, если модуль работает в мире на любой системе.';

export const FORM_DESCRIPTION_LABEL = 'Краткое описание';

export const FORM_DESCRIPTION_PLACEHOLDER =
  'Что делает модуль и кому он пригодится';

export const FORM_SUBMIT_LABEL = 'Отправить';

export const FORM_SUBMIT_ICON = 'tabler:send';

export const FORM_RESUBMIT_LABEL = 'Отправить заново';

export const CANCEL_LABEL = 'Отмена';

export const SUBMITTED_TOAST = 'Заявка отправлена на рассмотрение';

export const RESUBMITTED_TOAST = 'Исправленная заявка отправлена';

/* ------------------------------------------------------------------ */
/* Карточка заявки                                                     */
/* ------------------------------------------------------------------ */

export const CARD_VERSION_PREFIX = 'v';

/** Значок модуля, если в манифесте его нет или он не из разрешённых коллекций. */
export const DEFAULT_MODULE_ICON = 'tabler:puzzle';

/** Коллекции значков, которые разрешены и сайту, и VTTG. */
export const ALLOWED_ICON_PREFIXES = ['tabler:', 'ttg:'] as const;

export const CARD_REPOSITORY_ICON = 'tabler:brand-git';

export const CARD_MANIFEST_ICON = 'tabler:file-code';

export const CARD_DOWNLOAD_ICON = 'tabler:file-zip';

export const CARD_REPOSITORY_LABEL = 'Репозиторий';

export const CARD_MANIFEST_LABEL = 'module.json';

export const CARD_DOWNLOAD_LABEL = 'Архив';

export const CARD_UNIVERSAL_LABEL = 'Любая система';

export const CARD_SUBMITTED_PREFIX = 'Подана';

export const CARD_SYNCED_PREFIX = 'Манифест прочитан';

export const CARD_MODERATOR_COMMENT_LABEL = 'Комментарий модератора';

export const CARD_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

export const EDIT_LABEL = 'Исправить';

export const EDIT_ICON = 'tabler:pencil';

export const REFRESH_MANIFEST_LABEL = 'Перечитать манифест';

export const REFRESH_MANIFEST_ICON = 'tabler:refresh';

export const REFRESHED_TOAST = 'Манифест перечитан';

export const WITHDRAW_LABEL = 'Отозвать';

export const WITHDRAW_ICON = 'tabler:trash';

export const WITHDRAW_CONFIRM_TITLE = 'Отозвать заявку?';

export const WITHDRAW_CONFIRM_DESCRIPTION =
  'Одобренный модуль пропадёт из каталога VTTG. Вернуть его можно только новой заявкой.';

export const WITHDRAWN_TOAST = 'Заявка отозвана';

/* ------------------------------------------------------------------ */
/* Модерация                                                           */
/* ------------------------------------------------------------------ */

export const MODERATION_TITLE = 'Модули VTTG';

export const VTTG_MODULES_DASHBOARD_TITLE = 'Модули VTTG';

export const VTTG_MODULES_DASHBOARD_DESCRIPTION =
  'Заявки авторов на включение модулей в каталог виртуального стола';

export const MODERATION_STATUS_ALL_LABEL = 'Все';

export const MODERATION_STATUS_ALL_VALUE = 'ALL';

export const MODERATION_EMPTY_TITLE = 'Заявок нет';

export const MODERATION_EMPTY_DESCRIPTION =
  'В этом статусе сейчас нет ни одной заявки.';

export const MODERATION_AUTHOR_PREFIX = 'Автор';

export const MANIFEST_SHOW_LABEL = 'Показать module.json';

export const MANIFEST_HIDE_LABEL = 'Скрыть module.json';

export const MANIFEST_SYSTEMS_MISMATCH_ICON = 'tabler:alert-triangle';

export const MANIFEST_SYSTEMS_MISMATCH_HINT =
  'В module.json указаны другие системы';

export const APPROVE_LABEL = 'Одобрить';

export const APPROVE_ICON = 'tabler:check';

export const APPROVED_TOAST = 'Модуль добавлен в каталог';

export const REJECT_LABEL = 'Отклонить';

export const TAKE_DOWN_LABEL = 'Снять из каталога';

export const REJECT_ICON = 'tabler:x';

export const REJECT_TITLE = 'Отклонить заявку';

export const TAKE_DOWN_TITLE = 'Снять модуль из каталога';

export const REJECT_COMMENT_LABEL = 'Причина';

export const REJECT_COMMENT_PLACEHOLDER =
  'Автор увидит этот текст в своей заявке';

export const REJECTED_TOAST = 'Заявка отклонена';

/* ------------------------------------------------------------------ */
/* Ошибки и уведомления                                                */
/* ------------------------------------------------------------------ */

export const VTTG_MODULES_UNKNOWN_ERROR_MESSAGE =
  'Не получилось. Попробуйте ещё раз';

export const VTTG_MODULES_SESSION_EXPIRED_MESSAGE =
  'Сессия истекла — войдите снова';

export const VTTG_MODULES_TOAST_SUCCESS_ICON = 'tabler:circle-check';

export const VTTG_MODULES_TOAST_ERROR_ICON = 'tabler:alert-circle';
