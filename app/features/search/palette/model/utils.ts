import {
  mapSearchItemsToPaths,
  mapSearchItemsToTypeNames,
  type SearchItemsType,
} from './const';

export const getPathBySearchItem = (
  action: SearchItemsType,
): SearchItemsType | string => {
  return mapSearchItemsToPaths.get(action) || action;
};

export const getTypeNameBySearchItem = (
  action: SearchItemsType,
): SearchItemsType | string => {
  return mapSearchItemsToTypeNames.get(action) || action;
};
