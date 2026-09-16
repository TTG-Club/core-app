import type { BreadcrumbItem } from '#ui/components/Breadcrumb.vue';

import {
  BREADCRUMB_HOME_LABEL,
  BREADCRUMB_HOME_PATH,
  BREADCRUMB_ROUTES,
} from '../model';

/**
 * Собирает хлебные крошки для пути страницы.
 *
 * Путь разбирается по сегментам: известные разделы берут название из
 * `BREADCRUMB_ROUTES`, неизвестные (идентификаторы сущностей) пропускаются.
 * Последняя крошка — текущая страница, она остаётся без ссылки и берёт
 * заголовок из карты, а если пути там нет — из `title` страницы.
 *
 * @param path - путь текущего маршрута (`route.path`)
 * @param title - заголовок текущей страницы
 */
export function buildBreadcrumbItems(
  path: string,
  title?: string,
): Array<BreadcrumbItem> {
  const segments = path.split('/').filter(Boolean);

  if (!segments.length) {
    return [];
  }

  const breadcrumbs: Array<BreadcrumbItem> = [
    {
      label: BREADCRUMB_HOME_LABEL,
      to: BREADCRUMB_HOME_PATH,
    },
  ];

  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    const section = BREADCRUMB_ROUTES[currentPath];

    if (index < segments.length - 1) {
      if (section) {
        breadcrumbs.push({
          label: section.label,
          to: section.navigable === false ? undefined : currentPath,
        });
      }

      return;
    }

    const label = section?.label ?? title;

    // Страница сущности внутри одноимённого раздела (`/tools/initiative/:id`)
    // носит название самого раздела — вторая такая же крошка ничего не
    // добавляет к пути.
    if (!label || label === breadcrumbs.at(-1)?.label) {
      return;
    }

    breadcrumbs.push({ label });
  });

  return breadcrumbs;
}
