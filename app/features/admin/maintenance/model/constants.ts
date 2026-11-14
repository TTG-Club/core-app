import type { BadgeProps } from '@nuxt/ui';

import type {
  MaintenanceSettingsUpdate,
  MaintenanceSiteId,
} from '#shared/types';

import { Role } from '~/shared/types';

/** Страница режима обновления в админке. */
export const MAINTENANCE_ADMIN_ROUTE = '/admin/maintenance';

/** Пустая форма — до загрузки сохранённой настройки. */
export const MAINTENANCE_ADMIN_EMPTY_FORM: MaintenanceSettingsUpdate = {
  enabled: true,
  allowedRoles: [],
  title: '',
  message: '',
};

/** Ключ данных настройки в админке. */
export const MAINTENANCE_ADMIN_DATA_KEY = 'admin-maintenance-settings';

export const MAINTENANCE_ADMIN_PAGE_TITLE = 'Закрытие на обновление';

/** Заголовок вкладки браузера — по образцу соседних страниц настроек. */
export const MAINTENANCE_ADMIN_SEO_TITLE = `${MAINTENANCE_ADMIN_PAGE_TITLE}: Настройки`;

export const MAINTENANCE_ADMIN_NAVIGATION_ICON = 'tabler:barrier-block';

export const MAINTENANCE_ADMIN_PAGE_HINT =
  'Пока режим включён, все, кроме администраторов и отмеченных ниже ролей, вместо любой страницы сайта видят заглушку с текстом ниже и формой входа (ответ 503, поисковики её не индексируют). API продолжает работать. Если хранилище настроек недоступно или настройку ни разу не сохраняли, сайт считается закрытым. У каждого сайта настройка своя: сайт D&D 2014 берёт её отсюда и, не получив, тоже считается закрытым.';

/** Вкладка сайта на странице режима обновления. */
export interface MaintenanceAdminSiteTab {
  label: string;
  /** Значение вкладки для `UTabs`. */
  value: MaintenanceSiteId;
  /** Пояснение к переключателю: когда сохранённое дойдёт до сайта. */
  switchDescription: string;
}

/** Вкладка, открытая при входе на страницу, — этот сайт. */
export const MAINTENANCE_ADMIN_DEFAULT_SITE: MaintenanceSiteId = '5e24';

/** Сайты на странице режима обновления: у каждого своя форма. */
export const MAINTENANCE_ADMIN_SITE_TABS: MaintenanceAdminSiteTab[] = [
  {
    label: 'Сайт D&D 2024',
    value: '5e24',
    switchDescription: 'Действует сразу после сохранения.',
  },
  {
    label: 'Сайт D&D 2014',
    value: '5e14',
    switchDescription:
      'Действует в течение минуты после сохранения: сайт D&D 2014 перечитывает настройку раз в минуту.',
  },
];

export const MAINTENANCE_ADMIN_SWITCH_LABEL = 'Сайт закрыт на обновление';

export const MAINTENANCE_ADMIN_ROLES_LABEL =
  'Кого ещё пускать на закрытый сайт';

export const MAINTENANCE_ADMIN_ROLES_HINT =
  'Администраторы проходят всегда. Роли, которой нет в списке, впишите её имя из core-api латиницей (например, TESTER) и нажмите Enter.';

export const MAINTENANCE_ADMIN_ROLES_PLACEHOLDER = 'Только администраторы';

/**
 * Подписи ролей в выборе «кого пускать». Администратора нет — он проходит
 * всегда. Новая роль в `Role` без подписи здесь не соберётся — так она сразу
 * попадёт в список.
 */
export const MAINTENANCE_ADMIN_ROLE_LABELS: Record<
  Exclude<Role, Role.ADMIN>,
  string
> = {
  [Role.MODERATOR]: 'Модераторы',
  [Role.WRITER]: 'Авторы',
  [Role.VTTG]: 'Подписчики VTTG',
  [Role.USER]: 'Все вошедшие пользователи',
};

export const MAINTENANCE_ADMIN_TITLE_LABEL = 'Заголовок заглушки';

export const MAINTENANCE_ADMIN_MESSAGE_LABEL = 'Текст заглушки';

export const MAINTENANCE_ADMIN_MESSAGE_HINT =
  'Обычный текст: переносы строк сохраняются, разметка не работает.';

export const MAINTENANCE_ADMIN_MESSAGE_ROWS = 6;

export const MAINTENANCE_ADMIN_SAVE_LABEL = 'Сохранить';

export const MAINTENANCE_ADMIN_SAVE_ICON = 'tabler:device-floppy';

export const MAINTENANCE_ADMIN_SAVE_SUCCESS_MESSAGE = 'Настройка сохранена';

export const MAINTENANCE_ADMIN_SAVE_ERROR_TITLE =
  'Не удалось сохранить настройку';

export const MAINTENANCE_ADMIN_LOAD_ERROR_TITLE =
  'Не удалось прочитать настройку из хранилища';

export const MAINTENANCE_ADMIN_LOAD_ERROR_ICON = 'tabler:alert-triangle';

export const MAINTENANCE_ADMIN_RETRY_LABEL = 'Повторить';

/** Подпись, пока настройку ни разу не сохраняли. */
export const MAINTENANCE_ADMIN_NEVER_SAVED_LABEL =
  'Настройку ещё не сохраняли — действует умолчание: сайт закрыт.';

export const MAINTENANCE_ADMIN_UPDATED_LABEL = 'Изменена';

/** Разделитель даты изменения и автора. */
export const MAINTENANCE_ADMIN_UPDATED_SEPARATOR = ' · ';

export const MAINTENANCE_ADMIN_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

/** Значок сохранённого состояния: подпись и цвет. */
export const MAINTENANCE_ADMIN_STATE_BADGES: Record<
  'closed' | 'open',
  { label: string; color: BadgeProps['color'] }
> = {
  closed: { label: 'Сейчас сайт закрыт', color: 'warning' },
  open: { label: 'Сейчас сайт открыт', color: 'success' },
};
