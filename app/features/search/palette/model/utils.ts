import { mapSearchItemsToPaths, mapSearchItemsToTypeNames } from './const';

import type { SearchItemsType } from './const';

export function getPathBySearchItem(
  action: SearchItemsType,
): SearchItemsType | string {
  return mapSearchItemsToPaths.get(action) || action;
}

export function getTypeNameBySearchItem(
  action: SearchItemsType,
): SearchItemsType | string {
  return mapSearchItemsToTypeNames.get(action) || action;
}
