import { ONE_DAY_IN_SECONDS } from '#shared/consts';

/** Ключ cookie, в котором хранится принятая версия уведомления */
export const COOKIE_CONSENT_KEY = 'ttg-cookie-consent';

/** Ключ sessionStorage для баннера, закрытого без согласия */
export const COOKIE_CONSENT_DISMISS_KEY = 'cookie-consent:dismissed';

/**
 * Версия текста уведомления. Если состав cookie или формулировка изменятся,
 * достаточно поднять версию — баннер снова покажется всем, кто соглашался
 * с предыдущей редакцией.
 */
export const COOKIE_CONSENT_VERSION = '2';

/** Срок хранения согласия — один год */
export const COOKIE_CONSENT_MAX_AGE = ONE_DAY_IN_SECONDS * 365;

/** Заголовок баннера */
export const COOKIE_CONSENT_TITLE = 'Мы используем cookie';

/** Текст уведомления */
export const COOKIE_CONSENT_DESCRIPTION =
  'Файлы cookie помогают сохранять ваши настройки, не терять авторизацию между визитами и собирать обезличенную статистику посещений. Продолжая пользоваться сайтом, вы соглашаетесь с их использованием.';

/** Подпись кнопки согласия */
export const COOKIE_CONSENT_ACCEPT_LABEL = 'Принять';

/** Подпись кнопки закрытия баннера */
export const COOKIE_CONSENT_CLOSE_LABEL = 'Закрыть';

/** Иконка уведомления о cookie; ею же подписана ссылка на страницу в подвале */
export const COOKIE_CONSENT_ICON = 'tabler:cookie';

/** Иконка кнопки закрытия баннера */
export const COOKIE_CONSENT_CLOSE_ICON = 'tabler:x';

/** Адрес страницы со списком собираемых cookie */
export const COOKIE_POLICY_ROUTE = '/cookies';

/** Подпись ссылки на страницу со списком cookie */
export const COOKIE_POLICY_LINK_LABEL = 'Подробнее о cookie';

/** Иконка после подписи ссылки на страницу со списком cookie */
export const COOKIE_POLICY_LINK_ICON = 'tabler:arrow-right';
