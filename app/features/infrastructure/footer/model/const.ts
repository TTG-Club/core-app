import {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
  SUPPORT_EMAIL_ICON,
} from '~/shared/consts';
import {
  COOKIE_NOTICE_ICON,
  COOKIE_POLICY_PAGE_TITLE,
  COOKIE_POLICY_ROUTE,
} from '~infrastructure/cookie-consent/model';
import {
  PRIVACY_POLICY_ICON,
  PRIVACY_POLICY_LINK_LABEL,
  PRIVACY_POLICY_ROUTE,
} from '~infrastructure/privacy-policy/model';
import {
  PUBLIC_OFFER_ICON,
  PUBLIC_OFFER_PAGE_TITLE,
  PUBLIC_OFFER_ROUTE,
} from '~infrastructure/public-offer/model';
import {
  USER_AGREEMENT_ICON,
  USER_AGREEMENT_PAGE_TITLE,
  USER_AGREEMENT_ROUTE,
} from '~infrastructure/user-agreement/model';

import { MENU_LINKS, MENU_SUPPORT } from '../../sidebar/menu/model';

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

/** Иконка почты службы поддержки */
export const FOOTER_SUPPORT_EMAIL_ICON = SUPPORT_EMAIL_ICON;

/** Ссылки на юридические документы сайта */
export const FOOTER_LEGAL_LINKS = [
  {
    label: PRIVACY_POLICY_LINK_LABEL,
    to: PRIVACY_POLICY_ROUTE,
    icon: PRIVACY_POLICY_ICON,
  },
  {
    label: COOKIE_POLICY_PAGE_TITLE,
    to: COOKIE_POLICY_ROUTE,
    icon: COOKIE_NOTICE_ICON,
  },
  {
    label: USER_AGREEMENT_PAGE_TITLE,
    to: USER_AGREEMENT_ROUTE,
    icon: USER_AGREEMENT_ICON,
  },
  {
    label: PUBLIC_OFFER_PAGE_TITLE,
    to: PUBLIC_OFFER_ROUTE,
    icon: PUBLIC_OFFER_ICON,
  },
];

/** Текст копирайта */
export const FOOTER_COPYRIGHT = `© 2022–${new Date().getFullYear()} TTG Club`;

/** Дисклеймер о правах */
export const FOOTER_DISCLAIMER =
  'Материалы представлены для ознакомления. Права на материалы Wizards of the Coast принадлежат Wizards of the Coast.';
