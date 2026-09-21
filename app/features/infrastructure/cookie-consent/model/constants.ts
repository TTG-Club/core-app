import { ONE_DAY_IN_SECONDS } from '#shared/consts';

/** Новый ключ отделяет закрытие уведомления от прежнего выбора согласия. */
export const COOKIE_NOTICE_KEY = 'ttg-cookie-notice';

/** При изменении версии уведомление показывается повторно. */
export const COOKIE_NOTICE_VERSION = '1';

/** Срок хранения отметки о закрытии уведомления — один год. */
export const COOKIE_NOTICE_MAX_AGE = ONE_DAY_IN_SECONDS * 365;

/** Заголовок уведомления. */
export const COOKIE_NOTICE_TITLE =
  'Используем куки для работы и улучшения сайта';

/** Кнопка закрытия уведомления. */
export const COOKIE_NOTICE_DISMISS_LABEL = 'Хорошо';

/** Текст уведомления об использовании файлов cookie. */
export const COOKIE_NOTICE_DESCRIPTION =
  'Оставаясь с нами, вы соглашаетесь на использование файлов cookie.';

/** Иконка уведомления и ссылок на страницу о cookie. */
export const COOKIE_NOTICE_ICON = 'tabler:cookie';

/** Адрес страницы о cookie. */
export const COOKIE_POLICY_ROUTE = '/cookies';
