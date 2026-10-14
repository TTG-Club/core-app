import type { Peer } from 'crossws';

import { StatusCodes } from 'http-status-codes';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import { FetchError } from 'ofetch';
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';
import {
  messageYjsSyncStep1,
  readSyncStep1,
  readSyncStep2,
  readUpdate,
  writeSyncStep1,
  writeUpdate,
} from 'y-protocols/sync';
import * as Y from 'yjs';
import { z } from 'zod';

import { USER_TOKEN_COOKIE } from '#shared/consts';

/**
 * Комнаты совместного рисования планов бастионов.
 *
 * Сервер только пересылает правки и держит общий документ в памяти, пока
 * план открыт: сохраняют план в core-api сами участники, через обычный
 * запрос со своим входом. Протокол — стандартный y-websocket (синхронизация
 * и присутствие), поэтому клиент — штатный `WebsocketProvider`.
 */

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

/** Сколько держать документ после ухода последнего участника. */
const ROOM_GRACE_MS = 60_000;

/** Предел одного сообщения: план целиком с запасом. */
const MAX_MESSAGE_BYTES = 4 * 1024 * 1024;

const MAX_PEERS_PER_ROOM = 32;
const MAX_ROOMS = 500;

const CLOSE_POLICY_VIOLATION = 1008;
const CLOSE_TRY_AGAIN_LATER = 1013;

const bastionIdSchema = z.string().uuid();

const planAccessSchema = z.object({
  canEdit: z.boolean(),
});

const peerContextSchema = z.object({
  bastionId: bastionIdSchema,
  canEdit: z.boolean(),
});

interface PlanSyncPeer {
  peer: Peer;
  canEdit: boolean;
  /** Клиенты Yjs, чьё присутствие пришло через это соединение. */
  clientIds: Set<number>;
}

interface PlanSyncRoom {
  doc: Y.Doc;
  awareness: Awareness;
  peers: Map<string, PlanSyncPeer>;
  closeTimer: ReturnType<typeof setTimeout> | undefined;
}

export interface PlanSyncAccess {
  bastionId: string;
  canEdit: boolean;
}

const rooms = new Map<string, PlanSyncRoom>();

/**
 * Токен пользователя из cookie запроса на подключение: серверные middleware
 * на подключение веб-сокета не срабатывают.
 *
 * @param headers Заголовки запроса.
 * @returns Токен или undefined.
 */
function getRequestToken(headers: Headers): string | undefined {
  const authorization = headers.get('authorization');

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length);
  }

  const prefix = `${USER_TOKEN_COOKIE}=`;

  const pair = (headers.get('cookie') ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return pair
    ? decodeURIComponent(pair.slice(prefix.length)) || undefined
    : undefined;
}

/**
 * Бастион из пути подключения `/bastion-plan-sync/<id>`.
 *
 * @param url Адрес запроса.
 * @returns Идентификатор бастиона или undefined.
 */
function getBastionId(url: string): string | undefined {
  const parsed = bastionIdSchema.safeParse(
    new URL(url).pathname.split('/').filter(Boolean).at(-1),
  );

  return parsed.success ? parsed.data : undefined;
}

/**
 * Проверяет право смотреть план тем же запросом, что и редактор: core-api
 * отвечает 403 или 404 чужим и сообщает, можно ли рисовать.
 *
 * @param request Запрос на подключение.
 * @returns Бастион и право правки.
 * @throws {Response} Отказ в подключении.
 */
export async function checkPlanSyncAccess(request: {
  url: string;
  headers: Headers;
}): Promise<PlanSyncAccess> {
  const bastionId = getBastionId(request.url);
  const token = getRequestToken(request.headers);

  if (!bastionId) {
    throw new Response(null, { status: StatusCodes.NOT_FOUND });
  }

  if (!token) {
    throw new Response(null, { status: StatusCodes.UNAUTHORIZED });
  }

  try {
    const { url } = getApiSecrets();

    const response = await $fetch<unknown>(
      `${url}/api/v2/player-bastions/${bastionId}/plan`,
      { headers: { authorization: `Bearer ${token}` }, retry: 0 },
    );

    const access = planAccessSchema.parse(response);

    return { bastionId, canEdit: access.canEdit };
  } catch (error) {
    const status =
      error instanceof FetchError && error.statusCode
        ? error.statusCode
        : StatusCodes.BAD_GATEWAY;

    throw new Response(null, { status });
  }
}

/**
 * Отправляет сообщение, не роняя комнату из-за одного оборванного соединения.
 *
 * @param target Участник.
 * @param message Сообщение.
 */
function send(target: PlanSyncPeer, message: Uint8Array): void {
  try {
    target.peer.send(message);
  } catch {
    target.peer.close();
  }
}

/**
 * Рассылает сообщение всем участникам комнаты, кроме источника.
 *
 * @param room Комната.
 * @param message Сообщение.
 * @param exceptPeerId Участник, которому не отправлять.
 */
function broadcast(
  room: PlanSyncRoom,
  message: Uint8Array,
  exceptPeerId?: string,
): void {
  for (const [peerId, target] of room.peers) {
    if (peerId !== exceptPeerId) {
      send(target, message);
    }
  }
}

/**
 * Комната бастиона: документ и присутствие. Создаётся с первым участником.
 *
 * @param bastionId Бастион.
 * @returns Комната.
 */
function getRoom(bastionId: string): PlanSyncRoom {
  const existing = rooms.get(bastionId);

  if (existing) {
    return existing;
  }

  const doc = new Y.Doc();
  const awareness = new Awareness(doc);

  // Сервер присутствия не публикует.
  awareness.setLocalState(null);

  const room: PlanSyncRoom = {
    doc,
    awareness,
    peers: new Map(),
    closeTimer: undefined,
  };

  doc.on('update', (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder();

    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    writeUpdate(encoder, update);

    broadcast(room, encoding.toUint8Array(encoder), getOriginPeerId(origin));
  });

  awareness.on(
    'update',
    (
      changes: {
        added: Array<number>;
        updated: Array<number>;
        removed: Array<number>;
      },
      origin: unknown,
    ) => {
      const peerId = getOriginPeerId(origin);
      const source = peerId ? room.peers.get(peerId) : undefined;

      if (source) {
        changes.added.forEach((clientId) => source.clientIds.add(clientId));

        changes.removed.forEach((clientId) =>
          source.clientIds.delete(clientId),
        );
      }

      const changed = [
        ...changes.added,
        ...changes.updated,
        ...changes.removed,
      ];

      const encoder = encoding.createEncoder();

      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);

      encoding.writeVarUint8Array(
        encoder,
        encodeAwarenessUpdate(awareness, changed),
      );

      broadcast(room, encoding.toUint8Array(encoder));
    },
  );

  rooms.set(bastionId, room);

  return room;
}

/**
 * Участник-источник транзакции: правки помечаются идентификатором
 * соединения, чтобы не отправлять их обратно.
 *
 * @param origin Источник транзакции.
 * @returns Идентификатор соединения или undefined.
 */
function getOriginPeerId(origin: unknown): string | undefined {
  return typeof origin === 'string' ? origin : undefined;
}

/**
 * Доступ, сохранённый при подключении.
 *
 * @param peer Соединение.
 * @returns Бастион и право правки или undefined.
 */
function getPeerAccess(peer: Peer): PlanSyncAccess | undefined {
  const parsed = peerContextSchema.safeParse(peer.context);

  return parsed.success ? parsed.data : undefined;
}

/**
 * Подключает участника: отправляет ему состояние документа и присутствие.
 *
 * @param peer Соединение.
 */
export function openPlanSyncPeer(peer: Peer): void {
  const access = getPeerAccess(peer);

  if (!access) {
    peer.close(CLOSE_POLICY_VIOLATION);

    return;
  }

  if (!rooms.has(access.bastionId) && rooms.size >= MAX_ROOMS) {
    peer.close(CLOSE_TRY_AGAIN_LATER);

    return;
  }

  const room = getRoom(access.bastionId);

  if (room.peers.size >= MAX_PEERS_PER_ROOM) {
    peer.close(CLOSE_TRY_AGAIN_LATER);

    return;
  }

  clearTimeout(room.closeTimer);
  room.closeTimer = undefined;

  const target: PlanSyncPeer = {
    peer,
    canEdit: access.canEdit,
    clientIds: new Set(),
  };

  room.peers.set(peer.id, target);

  const syncEncoder = encoding.createEncoder();

  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  writeSyncStep1(syncEncoder, room.doc);
  send(target, encoding.toUint8Array(syncEncoder));

  const states = [...room.awareness.getStates().keys()];

  if (states.length) {
    const awarenessEncoder = encoding.createEncoder();

    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);

    encoding.writeVarUint8Array(
      awarenessEncoder,
      encodeAwarenessUpdate(room.awareness, states),
    );

    send(target, encoding.toUint8Array(awarenessEncoder));
  }
}

/**
 * Обрабатывает сообщение синхронизации. Участник без права правки получает
 * документ, но его правки не принимаются.
 *
 * @param room Комната.
 * @param source Участник.
 * @param decoder Сообщение после типа.
 */
function handleSyncMessage(
  room: PlanSyncRoom,
  source: PlanSyncPeer,
  decoder: decoding.Decoder,
): void {
  const encoder = encoding.createEncoder();
  const syncType = decoding.readVarUint(decoder);

  encoding.writeVarUint(encoder, MESSAGE_SYNC);

  if (syncType === messageYjsSyncStep1) {
    readSyncStep1(decoder, encoder, room.doc);
  } else if (source.canEdit) {
    if (syncType === messageYjsSyncStep1 + 1) {
      readSyncStep2(decoder, room.doc, source.peer.id);
    } else {
      readUpdate(decoder, room.doc, source.peer.id);
    }
  }

  // Ответ есть только на первый шаг: в нём недостающие участнику правки.
  if (encoding.length(encoder) > 1) {
    send(source, encoding.toUint8Array(encoder));
  }
}

/**
 * Принимает сообщение участника.
 *
 * @param peer Соединение.
 * @param data Сообщение.
 */
export function handlePlanSyncMessage(peer: Peer, data: Uint8Array): void {
  const access = getPeerAccess(peer);
  const room = access ? rooms.get(access.bastionId) : undefined;
  const source = room?.peers.get(peer.id);

  if (!room || !source || data.byteLength > MAX_MESSAGE_BYTES) {
    peer.close(CLOSE_POLICY_VIOLATION);

    return;
  }

  try {
    const decoder = decoding.createDecoder(data);
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MESSAGE_SYNC) {
      handleSyncMessage(room, source, decoder);
    } else if (messageType === MESSAGE_AWARENESS) {
      applyAwarenessUpdate(
        room.awareness,
        decoding.readVarUint8Array(decoder),
        peer.id,
      );
    }
  } catch (error) {
    consola.warn('[PLAN SYNC] Bad message', error);
    peer.close(CLOSE_POLICY_VIOLATION);
  }
}

/**
 * Отключает участника: убирает его курсоры и, если комната опустела,
 * освобождает документ через минуту — на случай переподключения.
 *
 * @param peer Соединение.
 */
export function closePlanSyncPeer(peer: Peer): void {
  const access = getPeerAccess(peer);
  const room = access ? rooms.get(access.bastionId) : undefined;
  const source = room?.peers.get(peer.id);

  if (!access || !room || !source) {
    return;
  }

  room.peers.delete(peer.id);
  removeAwarenessStates(room.awareness, [...source.clientIds], null);

  if (room.peers.size) {
    return;
  }

  room.closeTimer = setTimeout(() => {
    if (room.peers.size) {
      return;
    }

    room.awareness.destroy();
    room.doc.destroy();
    rooms.delete(access.bastionId);
  }, ROOM_GRACE_MS);
}
