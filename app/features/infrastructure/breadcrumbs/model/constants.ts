import type { BreadcrumbRoute } from './types';

import {
  GAMES_CREATE_NAVIGATION_LABEL,
  GAMES_CREATE_ROUTE,
  GAMES_MY_NAVIGATION_LABEL,
  GAMES_MY_ROUTE,
  GAMES_NAVIGATION_LABEL,
  GAMES_ROUTE,
} from '~find-game/model';

/** Название корневой крошки */
export const BREADCRUMB_HOME_LABEL = 'Главная';

/** Путь корневой крошки */
export const BREADCRUMB_HOME_PATH = '/';

/**
 * Карта разделов сайта: путь → название крошки.
 *
 * Названия здесь свои и короче заголовков страниц: крошка называет раздел, а
 * не то, как страница подписана в шапке («Заклинания» вместо «Мастерская
 * заклинаний»). Путь, которого в карте нет, считается динамическим
 * (`/spells/fireball`) и попадает в крошки только последним — с заголовком
 * самой страницы.
 */
export const BREADCRUMB_ROUTES: Record<string, BreadcrumbRoute> = {
  // Справочник
  '/classes': { label: 'Классы' },
  '/species': { label: 'Виды' },
  '/feats': { label: 'Черты' },
  '/backgrounds': { label: 'Предыстории' },
  '/spells': { label: 'Заклинания' },
  '/items': { label: 'Предметы' },
  '/magic-items': { label: 'Магические предметы' },
  '/bestiary': { label: 'Бестиарий' },
  '/glossary': { label: 'Глоссарий' },
  '/sources': { label: 'Источники' },

  // Публикации
  '/articles': { label: 'Статьи' },
  '/news': { label: 'Новости' },

  // Поиск игр: у каталога, своих игр и создания игры общий заголовок
  // страницы, поэтому названия крошек берём из навигации
  [GAMES_ROUTE]: { label: GAMES_NAVIGATION_LABEL },
  [GAMES_CREATE_ROUTE]: { label: GAMES_CREATE_NAVIGATION_LABEL },
  [GAMES_MY_ROUTE]: { label: GAMES_MY_NAVIGATION_LABEL },

  // Инструменты: страниц `/tools` и `/calculators` нет, в меню обе группы
  // живут под одним разделом
  '/tools': { label: 'Инструменты', navigable: false },
  '/tools/initiative': { label: 'Трекер инициативы' },
  '/tools/character-sheet': { label: 'Листы персонажей' },
  '/calculators': { label: 'Инструменты', navigable: false },
  '/tokenator': { label: 'Токенатор' },

  // Мастерская
  '/workshop': { label: 'Мастерская' },
  '/workshop/backgrounds': { label: 'Предыстории' },
  '/workshop/bestiary': { label: 'Бестиарий' },
  '/workshop/classes': { label: 'Классы' },
  '/workshop/feats': { label: 'Черты' },
  '/workshop/glossary': { label: 'Глоссарий' },
  '/workshop/items': { label: 'Предметы' },
  '/workshop/magic-items': { label: 'Магические предметы' },
  '/workshop/sources': { label: 'Источники' },
  '/workshop/species': { label: 'Виды' },
  '/workshop/spells': { label: 'Заклинания' },

  // Администрирование и модерация
  '/admin': { label: 'Админ-панель' },
  '/admin/articles': { label: 'Статьи и новости' },
  '/moderation': { label: 'Панель модератора' },
};
