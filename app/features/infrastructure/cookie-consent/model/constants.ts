import { ONE_DAY_IN_SECONDS } from '#shared/consts';

/** Ключ cookie, в котором хранится выбор посетителя в уведомлении */
export const COOKIE_CONSENT_KEY = 'ttg-cookie-consent';

/**
 * Версия уведомления. Выбор, сделанный в другой версии, не учитывается —
 * уведомление покажется снова. Версия 4 разделяет согласие на год и закрытие
 * без аналитики на 24 часа. Продолжение просмотра согласием не считается.
 */
export const COOKIE_CONSENT_VERSION = '4';

/** Выбор «Принять»: разрешены и необходимые, и аналитические cookie */
export const COOKIE_CONSENT_CHOICE_ALL = 'all';

/** Закрытие крестиком: аналитика не подключается */
export const COOKIE_CONSENT_CHOICE_NECESSARY = 'necessary';

/** Все варианты выбора в уведомлении */
export const COOKIE_CONSENT_CHOICES = [
  COOKIE_CONSENT_CHOICE_ALL,
  COOKIE_CONSENT_CHOICE_NECESSARY,
] as const;

/** Срок хранения согласия — один год */
export const COOKIE_CONSENT_MAX_AGE = ONE_DAY_IN_SECONDS * 365;

/** Cookie с версией уведомления и временем следующего показа после закрытия */
export const COOKIE_CONSENT_DISMISS_KEY = 'ttg-cookie-dismissed';

/** Срок скрытия уведомления после закрытия — 24 часа */
export const COOKIE_CONSENT_DISMISS_MAX_AGE = ONE_DAY_IN_SECONDS;

/** Срок скрытия в миллисекундах для отметки времени и таймера */
export const COOKIE_CONSENT_DISMISS_DURATION =
  COOKIE_CONSENT_DISMISS_MAX_AGE * 1000;

/** Заголовок уведомления */
export const COOKIE_CONSENT_TITLE =
  'Используем куки для работы и улучшения сайта';

/** Подпись кнопки согласия на все cookie */
export const COOKIE_CONSENT_ACCEPT_LABEL = 'Принять';

/** Текст уведомления; подпись кнопки берётся из константы, чтобы не разойтись с кнопкой */
export const COOKIE_CONSENT_DESCRIPTION = `Нажимая «${COOKIE_CONSENT_ACCEPT_LABEL}», вы разрешаете все куки и статистику TTG Club, Яндекса и Google. Крестик — только необходимые, без статистики.`;

/** Подпись крестика: он тоже оставляет только необходимые cookie */
export const COOKIE_CONSENT_CLOSE_LABEL =
  'Закрыть и оставить только необходимые cookie';

/** Иконка уведомления о cookie; ею же подписаны ссылки на страницу о cookie */
export const COOKIE_CONSENT_ICON = 'tabler:cookie';

/** Иконка кнопки закрытия уведомления */
export const COOKIE_CONSENT_CLOSE_ICON = 'tabler:x';

/** Адрес страницы о cookie */
export const COOKIE_POLICY_ROUTE = '/cookies';
