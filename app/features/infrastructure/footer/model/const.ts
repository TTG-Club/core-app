import {
  MENU_LINKS,
  MENU_SUPPORT,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
} from '../../sidebar/menu/model';

/** Маппинг иконок на человекочитаемые названия для aria-label */
const SOCIAL_LABEL_MAP: Record<string, string> = {
  'ttg:vk': 'ВКонтакте',
  'ttg:discord': 'Discord',
  'ttg:telegram': 'Telegram',
  'ttg:youtube': 'YouTube',
};

/** Ссылки на социальные сети подвала с aria-label */
export const FOOTER_SOCIAL_LINKS = MENU_LINKS.map((link) => ({
  ...link,
  label: SOCIAL_LABEL_MAP[link.icon] ?? link.icon,
}));

/** Ссылки на поддержку проекта в подвале (только основной Boosty) */
export const FOOTER_SUPPORT_LINKS = MENU_SUPPORT.slice(0, 1);

/** Email адрес службы поддержки */
export const FOOTER_SUPPORT_EMAIL = SUPPORT_EMAIL;

/** Ссылка mailto для службы поддержки */
export const FOOTER_SUPPORT_EMAIL_HREF = SUPPORT_EMAIL_HREF;

/** Текст копирайта */
export const FOOTER_COPYRIGHT = `© 2022–${new Date().getFullYear()} TTG Club`;

/** Дисклеймер о правах */
export const FOOTER_DISCLAIMER =
  'Материалы представлены для ознакомления. Права на материалы Wizards of the Coast принадлежат Wizards of the Coast.';
