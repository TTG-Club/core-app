import type { ListItem } from '@unhead/schema-org';

import type { BreadcrumbItem } from '#ui/components/Breadcrumb.vue';

/**
 * Переводит крошки в элементы разметки `BreadcrumbList` для schema.org.
 *
 * Адреса остаются относительными: `nuxt-schema-org` сам достраивает их до
 * абсолютных по адресу сайта. У последней крошки адреса нет — по схеме он
 * для неё и не нужен.
 *
 * @param breadcrumbs - крошки текущей страницы
 */
export function buildBreadcrumbSchemaItems(
  breadcrumbs: Array<BreadcrumbItem>,
): Array<ListItem> {
  return breadcrumbs.flatMap((crumb) =>
    crumb.label
      ? [
          {
            name: crumb.label,
            item: typeof crumb.to === 'string' ? crumb.to : undefined,
          },
        ]
      : [],
  );
}
