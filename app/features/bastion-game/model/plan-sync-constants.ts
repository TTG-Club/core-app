/** Карты общего документа плана (Yjs). */
export const PLAN_SYNC_MAPS = {
  meta: 'meta',
  levels: 'levels',
  rooms: 'rooms',
  doors: 'doors',
  windows: 'windows',
  towerOpenings: 'towerOpenings',
  stairs: 'stairs',
  columns: 'columns',
  defenseWalls: 'defenseWalls',
  furniture: 'furniture',
  defenseGates: 'defenseGates',
} as const;

/** Карты с содержимым плана — их отслеживает личная отмена. */
export const PLAN_CONTENT_MAPS = [
  PLAN_SYNC_MAPS.levels,
  PLAN_SYNC_MAPS.rooms,
  PLAN_SYNC_MAPS.doors,
  PLAN_SYNC_MAPS.windows,
  PLAN_SYNC_MAPS.towerOpenings,
  PLAN_SYNC_MAPS.stairs,
  PLAN_SYNC_MAPS.columns,
  PLAN_SYNC_MAPS.defenseWalls,
  PLAN_SYNC_MAPS.furniture,
  PLAN_SYNC_MAPS.defenseGates,
] as const;

/** Ключи служебной карты `meta`. */
export const PLAN_SYNC_META_KEYS = {
  version: 'version',
  seeded: 'seeded',
} as const;

/** Поля комнаты в общем документе, которых нет среди полей плана. */
export const PLAN_SYNC_ROOM_KEYS = {
  cells: 'cells',
  order: 'order',
} as const;

/**
 * Начальное содержимое пишется от имени служебного клиента с номером от
 * версии плана. Одна и та же версия у всех даёт побайтно одинаковые правки,
 * и Yjs не задваивает план, когда его одновременно заводят два человека.
 */
export const PLAN_SYNC_SEED_CLIENT = {
  base: 0x7f000000,
  range: 0x00ffffff,
} as const;
