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
export const COOKIE_CONSENT_VERSION = '1';

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
