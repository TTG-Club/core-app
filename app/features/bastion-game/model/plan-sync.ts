import type {
  PlanCell,
  PlanColumn,
  PlanDocument,
  PlanDoor,
  PlanFurniture,
  PlanRoom,
  PlanStair,
  PlanTowerOpening,
  PlanWindow,
} from './plan-schema';

import { isEqual } from 'es-toolkit';
import * as Y from 'yjs';
import { z } from 'zod';

import { ROOM_KIND_LABELS } from './plan-constants';
import { resolvePlanConflicts } from './plan-edit';
import { getCellKey, getEdgeKey } from './plan-geometry';
import {
  planCellSchema,
  planCircleSchema,
  planColumnSchema,
  planDoorSchema,
  planEdgeSchema,
  planFurnitureSchema,
  planStairSchema,
  planTowerOpeningSchema,
  ROOM_KINDS,
} from './plan-schema';

/**
 * Общий документ плана для совместного рисования (Yjs).
 *
 * Каждая коллекция — карта по ключу объекта, а клетки комнаты — карта по
 * ключу клетки. Так правки разных людей сливаются поштучно: один дорисовал
 * клетки, другой поставил дверь — сохранятся обе правки. Значения читаются
 * через Zod: документ приходит от других людей и считается внешними данными.
 *
 * Модуль не входит в barrel модели: Yjs нужен только открытому редактору
 * плана, поэтому редактор загружает его динамически, в браузере.
 */

/** Карты общего документа. */
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
} as const;

/** Карты с содержимым плана — их отслеживает личная отмена. */
const PLAN_CONTENT_MAPS = [
  PLAN_SYNC_MAPS.levels,
  PLAN_SYNC_MAPS.rooms,
  PLAN_SYNC_MAPS.doors,
  PLAN_SYNC_MAPS.windows,
  PLAN_SYNC_MAPS.towerOpenings,
  PLAN_SYNC_MAPS.stairs,
  PLAN_SYNC_MAPS.columns,
  PLAN_SYNC_MAPS.defenseWalls,
  PLAN_SYNC_MAPS.furniture,
] as const;

const META_VERSION = 'version';
const META_SEEDED = 'seeded';

/**
 * Начальное содержимое пишется от имени служебного клиента с номером от
 * версии плана. Одна и та же версия у всех даёт побайтно одинаковые правки,
 * и Yjs не задваивает план, когда его одновременно заводят два человека.
 */
const SEED_CLIENT_BASE = 0x7f000000;
const SEED_CLIENT_RANGE = 0x00ffffff;

const roomFieldsSchema = z.object({
  name: z.string(),
  kind: z.enum(ROOM_KINDS),
  level: z.number(),
  facilityId: z.string().nullable(),
  shape: planCircleSchema.nullable(),
  order: z.number(),
});

const metaVersionSchema = z.number().int().nonnegative();

type PlanCollectionKey = (typeof PLAN_CONTENT_MAPS)[number];

/**
 * Карта общего документа.
 *
 * @param doc Общий документ.
 * @param name Имя карты.
 * @returns Карта.
 */
function getMap(doc: Y.Doc, name: string): Y.Map<unknown> {
  return doc.getMap<unknown>(name);
}

/**
 * Карты, которые меняет правка плана: на них настраивается личная отмена.
 *
 * @param doc Общий документ.
 * @returns Карты с содержимым плана.
 */
export function getPlanContentMaps(doc: Y.Doc): Array<Y.Map<unknown>> {
  return PLAN_CONTENT_MAPS.map((name) => getMap(doc, name));
}

/**
 * Ключ проёма в стене башни: у одной башни на одном угле проём один.
 *
 * @param opening Проём.
 * @returns Ключ.
 */
function getOpeningKey(opening: PlanTowerOpening): string {
  return `${opening.roomId}:${opening.angle}`;
}

/**
 * Значения карты, прошедшие проверку схемой, по порядку ключей.
 *
 * @param map Карта.
 * @param schema Схема значения.
 * @returns Значения.
 */
function readValues<T>(map: Y.Map<unknown>, schema: z.ZodType<T>): Array<T> {
  return [...map.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .flatMap(([, value]) => {
      const parsed = schema.safeParse(value);

      return parsed.success ? [parsed.data] : [];
    });
}

/**
 * Клетки комнаты из карты «x:y → true».
 *
 * @param cells Карта клеток.
 * @returns Клетки по порядку строк и столбцов.
 */
function readCells(cells: Y.Map<unknown>): Array<PlanCell> {
  return [...cells.keys()]
    .flatMap((key) => {
      const [x, y] = key.split(':').map(Number);
      const parsed = planCellSchema.safeParse({ x, y });

      return parsed.success && Number.isInteger(x) && Number.isInteger(y)
        ? [parsed.data]
        : [];
    })
    .sort((first, second) => first.y - second.y || first.x - second.x);
}

/**
 * Комнаты общего документа по порядку создания.
 *
 * @param map Карта комнат.
 * @returns Комнаты.
 */
function readRooms(map: Y.Map<unknown>): Array<PlanRoom> {
  return [...map.entries()]
    .flatMap(([id, value]) => {
      if (!(value instanceof Y.Map)) {
        return [];
      }

      const fields = roomFieldsSchema.safeParse(value.toJSON());
      const cells = value.get('cells');

      if (!fields.success || !(cells instanceof Y.Map)) {
        return [];
      }

      const { order, ...room } = fields.data;

      return [
        {
          order,
          room: {
            id,
            name: room.name || ROOM_KIND_LABELS[room.kind],
            kind: room.kind,
            level: room.level,
            facilityId: room.facilityId ?? undefined,
            cells: readCells(cells),
            shape:
              room.kind === 'TOWER' ? (room.shape ?? undefined) : undefined,
          },
        },
      ];
    })
    .sort(
      (first, second) =>
        first.order - second.order
        || first.room.id.localeCompare(second.room.id),
    )
    .map(({ room }) => room);
}

/**
 * Собирает план из общего документа и сводит противоречия слияния.
 *
 * @param doc Общий документ.
 * @returns План.
 */
export function readPlanFromDoc(doc: Y.Doc): PlanDocument {
  const levels = [...getMap(doc, PLAN_SYNC_MAPS.levels).keys()]
    .map(Number)
    .filter((level) => Number.isInteger(level));

  return resolvePlanConflicts({
    levels,
    rooms: readRooms(getMap(doc, PLAN_SYNC_MAPS.rooms)),
    doors: readValues(getMap(doc, PLAN_SYNC_MAPS.doors), planDoorSchema),
    windows: readValues(getMap(doc, PLAN_SYNC_MAPS.windows), planEdgeSchema),
    towerOpenings: readValues(
      getMap(doc, PLAN_SYNC_MAPS.towerOpenings),
      planTowerOpeningSchema,
    ).map((opening) => ({ ...opening, kind: opening.kind ?? undefined })),
    stairs: readValues(getMap(doc, PLAN_SYNC_MAPS.stairs), planStairSchema),
    columns: readValues(getMap(doc, PLAN_SYNC_MAPS.columns), planColumnSchema),
    defenseWalls: readValues(
      getMap(doc, PLAN_SYNC_MAPS.defenseWalls),
      planCellSchema,
    ),
    furniture: readValues(
      getMap(doc, PLAN_SYNC_MAPS.furniture),
      planFurnitureSchema,
    ),
  });
}

/**
 * Переносит в карту разницу двух списков: убирает пропавшие ключи и пишет
 * новые и изменённые значения. Чужие ключи, которых не было ни в одном из
 * списков, не трогаются.
 *
 * @param map Карта.
 * @param previous Список до правки.
 * @param next Список после правки.
 * @param getKey Ключ объекта.
 * @param toValue Значение для карты.
 */
function applyListChanges<T>(
  map: Y.Map<unknown>,
  previous: ReadonlyArray<T>,
  next: ReadonlyArray<T>,
  getKey: (item: T) => string,
  toValue: (item: T) => unknown,
): void {
  const before = new Map(previous.map((item) => [getKey(item), item]));
  const after = new Map(next.map((item) => [getKey(item), item]));

  for (const key of before.keys()) {
    if (!after.has(key)) {
      map.delete(key);
    }
  }

  for (const [key, item] of after) {
    const old = before.get(key);

    if (!old || !isEqual(old, item)) {
      map.set(key, toValue(item));
    }
  }
}

/**
 * Значение двери, окна, лестницы или колонны в карте: обычный объект без
 * `undefined`.
 *
 * @param item Объект плана.
 * @returns Значение.
 */
function toPlainValue(
  item:
    | PlanDoor
    | PlanWindow
    | PlanStair
    | PlanColumn
    | PlanFurniture
    | PlanCell,
): unknown {
  return { ...item };
}

/**
 * Проём башни для карты: пустой вид двери хранится как null.
 *
 * @param opening Проём.
 * @returns Значение.
 */
function toOpeningValue(opening: PlanTowerOpening): unknown {
  return { ...opening, kind: opening.kind ?? null };
}

/**
 * Поля комнаты для карты.
 *
 * @param room Комната.
 * @returns Поля без клеток.
 */
function getRoomFields(room: PlanRoom): Record<string, unknown> {
  return {
    name: room.name,
    kind: room.kind,
    level: room.level,
    facilityId: room.facilityId ?? null,
    shape: room.shape ?? null,
  };
}

/**
 * Создаёт комнату в общем документе.
 *
 * @param rooms Карта комнат.
 * @param room Комната.
 * @param order Порядок комнаты: при споре за клетку побеждает меньший.
 */
function insertRoom(
  rooms: Y.Map<unknown>,
  room: PlanRoom,
  order: number,
): void {
  const target = new Y.Map<unknown>();
  const cells = new Y.Map<unknown>();

  for (const [field, value] of Object.entries(getRoomFields(room))) {
    target.set(field, value);
  }

  target.set('order', order);

  for (const cell of room.cells) {
    cells.set(getCellKey(cell.x, cell.y), true);
  }

  target.set('cells', cells);
  rooms.set(room.id, target);
}

/**
 * Переносит правку комнат: поля и клетки меняются поштучно, чтобы правки
 * разных людей в одной комнате сливались.
 *
 * @param rooms Карта комнат.
 * @param previous Комнаты до правки.
 * @param next Комнаты после правки.
 * @param nextOrder Порядок для новых комнат.
 */
function applyRoomChanges(
  rooms: Y.Map<unknown>,
  previous: ReadonlyArray<PlanRoom>,
  next: ReadonlyArray<PlanRoom>,
  nextOrder: () => number,
): void {
  const before = new Map(previous.map((room) => [room.id, room]));
  const after = new Set(next.map((room) => room.id));

  for (const id of before.keys()) {
    if (!after.has(id)) {
      rooms.delete(id);
    }
  }

  for (const room of next) {
    const old = before.get(room.id);

    // Нетронутую комнату не пишем: иначе вернулась бы комната, которую
    // тем временем удалил другой человек.
    if (old && isEqual(old, room)) {
      continue;
    }

    const target = rooms.get(room.id);
    const cells = target instanceof Y.Map ? target.get('cells') : undefined;

    // Комнату мог удалить другой человек, пока её правили здесь: тогда
    // она возвращается целиком.
    if (!old || !(target instanceof Y.Map) || !(cells instanceof Y.Map)) {
      insertRoom(rooms, room, nextOrder());

      continue;
    }

    const oldFields = getRoomFields(old);

    for (const [field, value] of Object.entries(getRoomFields(room))) {
      if (!isEqual(oldFields[field], value)) {
        target.set(field, value);
      }
    }

    applyListChanges(
      cells,
      old.cells,
      room.cells,
      (cell) => getCellKey(cell.x, cell.y),
      () => true,
    );
  }
}

/**
 * Переносит в общий документ разницу между планом до правки и после. Пишется
 * только то, что поменяла эта правка, поэтому чужие правки, пришедшие за это
 * время, не затираются.
 *
 * @param doc Общий документ.
 * @param previous План до правки.
 * @param next План после правки.
 * @param origin Источник транзакции (для личной отмены).
 * @param nextOrder Порядок для новых комнат; по умолчанию время создания.
 */
export function applyPlanChanges(
  doc: Y.Doc,
  previous: PlanDocument,
  next: PlanDocument,
  origin: unknown,
  nextOrder: () => number = Date.now,
): void {
  const lists: Array<{
    name: PlanCollectionKey;
    apply: (map: Y.Map<unknown>) => void;
  }> = [
    {
      name: PLAN_SYNC_MAPS.levels,
      apply: (map) =>
        applyListChanges(map, previous.levels, next.levels, String, () => true),
    },
    {
      name: PLAN_SYNC_MAPS.doors,
      apply: (map) =>
        applyListChanges(
          map,
          previous.doors,
          next.doors,
          getEdgeKey,
          toPlainValue,
        ),
    },
    {
      name: PLAN_SYNC_MAPS.windows,
      apply: (map) =>
        applyListChanges(
          map,
          previous.windows,
          next.windows,
          getEdgeKey,
          toPlainValue,
        ),
    },
    {
      name: PLAN_SYNC_MAPS.towerOpenings,
      apply: (map) =>
        applyListChanges(
          map,
          previous.towerOpenings,
          next.towerOpenings,
          getOpeningKey,
          toOpeningValue,
        ),
    },
    {
      name: PLAN_SYNC_MAPS.stairs,
      apply: (map) =>
        applyListChanges(
          map,
          previous.stairs,
          next.stairs,
          (stair) => stair.id,
          toPlainValue,
        ),
    },
    {
      name: PLAN_SYNC_MAPS.columns,
      apply: (map) =>
        applyListChanges(
          map,
          previous.columns,
          next.columns,
          (column) => column.id,
          toPlainValue,
        ),
    },
    {
      name: PLAN_SYNC_MAPS.furniture,
      apply: (map) =>
        applyListChanges(
          map,
          previous.furniture,
          next.furniture,
          (item) => item.id,
          toPlainValue,
        ),
    },
    {
      name: PLAN_SYNC_MAPS.defenseWalls,
      apply: (map) =>
        applyListChanges(
          map,
          previous.defenseWalls,
          next.defenseWalls,
          (cell) => getCellKey(cell.x, cell.y),
          toPlainValue,
        ),
    },
  ];

  doc.transact(() => {
    for (const { name, apply } of lists) {
      apply(getMap(doc, name));
    }

    // Новые комнаты встают в конец: порядок — время создания, а при споре
    // за клетку побеждает комната, нарисованная раньше.
    applyRoomChanges(
      getMap(doc, PLAN_SYNC_MAPS.rooms),
      previous.rooms,
      next.rooms,
      nextOrder,
    );
  }, origin);
}

/**
 * Заведён ли в общем документе план из базы.
 *
 * @param doc Общий документ.
 * @returns true, если начальное содержимое уже есть.
 */
export function isPlanDocSeeded(doc: Y.Doc): boolean {
  return getMap(doc, PLAN_SYNC_MAPS.meta).get(META_SEEDED) === true;
}

/**
 * Версия плана в базе, известная участникам: с ней сохраняется следующая
 * правка.
 *
 * @param doc Общий документ.
 * @returns Версия или undefined, если план ещё не заведён.
 */
export function getPlanDocVersion(doc: Y.Doc): number | undefined {
  const parsed = metaVersionSchema.safeParse(
    getMap(doc, PLAN_SYNC_MAPS.meta).get(META_VERSION),
  );

  return parsed.success ? parsed.data : undefined;
}

/**
 * Записывает версию плана после сохранения, чтобы следующий сохраняющий
 * участник не получил отказ из-за устаревшей версии.
 *
 * @param doc Общий документ.
 * @param version Новая версия.
 * @param origin Источник транзакции.
 */
export function setPlanDocVersion(
  doc: Y.Doc,
  version: number,
  origin: unknown,
): void {
  doc.transact(() => {
    getMap(doc, PLAN_SYNC_MAPS.meta).set(META_VERSION, version);
  }, origin);
}

/**
 * Начальное содержимое общего документа — план из базы. Пишется отдельным
 * документом от служебного клиента, номер которого зависит только от версии:
 * два участника, заведшие одну версию, получают одинаковые правки.
 *
 * @param document План из базы.
 * @param version Его версия.
 * @returns Правка Yjs для `Y.applyUpdate`.
 */
export function createPlanSeedUpdate(
  document: PlanDocument,
  version: number,
): Uint8Array {
  const seed = new Y.Doc();

  seed.clientID = SEED_CLIENT_BASE + (version % SEED_CLIENT_RANGE);

  seed.transact(() => {
    const meta = getMap(seed, PLAN_SYNC_MAPS.meta);

    meta.set(META_SEEDED, true);
    meta.set(META_VERSION, version);
  });

  // Порядок комнат при заведении — их место в списке из базы, а не время:
  // иначе правки у двух участников разошлись бы.
  let order = 0;

  applyPlanChanges(seed, createEmptyDocument(), document, null, () => order++);

  const update = Y.encodeStateAsUpdate(seed);

  seed.destroy();

  return update;
}

/**
 * Пустой план без этажей — точка отсчёта для заведения: первый этаж тоже
 * попадает в общий документ.
 *
 * @returns Пустой план.
 */
function createEmptyDocument(): PlanDocument {
  return {
    levels: [],
    rooms: [],
    doors: [],
    windows: [],
    towerOpenings: [],
    stairs: [],
    columns: [],
    defenseWalls: [],
    furniture: [],
  };
}
