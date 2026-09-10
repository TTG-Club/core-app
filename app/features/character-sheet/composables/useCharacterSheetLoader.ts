import type { MaybeRefOrGetter } from 'vue';

import type { CharacterSheetDetail, SheetReadonlyReason } from '../model';

import { StatusCodes } from 'http-status-codes';
import { toValue } from 'vue';

import { getFetchStatus } from '~initiative/model';

import {
  fetchCharacterSheet,
  fetchCharacterSheetForAdmin,
  fetchSharedCharacterSheet,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';
import { useCharacterSheetShare } from './useCharacterSheetShare';

/** Статус загрузки листа: idle — лист не выбран (пустой идентификатор). */
export type SheetLoadStatus =
  | 'idle'
  | 'pending'
  | 'ready'
  | 'notFound'
  | 'error';

/** Настройки загрузчика листа. */
export interface SheetLoaderOptions {
  /**
   * Лист открыт по ссылке «поделиться»: грузится публичной ручкой по токену,
   * а состояние переводится в режим просмотра. Идентификатор в этом случае —
   * токен ссылки, а не id листа.
   *
   * Реактивный: правая панель списка показывает то свой лист, то чужой по
   * ссылке, не перемонтируясь, — режим должен переключаться вместе с выбором.
   */
  shared?: MaybeRefOrGetter<boolean>;
}

/** Загруженный лист и режим, в котором его показывать. */
interface LoadedSheet {
  detail: CharacterSheetDetail;

  /** Причина режима «только просмотр»; null — лист свой и открыт на правку. */
  readonlyReason: SheetReadonlyReason | null;
}

/**
 * Загрузка сохранённого листа в общее состояние `useCharacterSheet` по
 * идентификатору. Используется страницей листа, панелью широкого режима и
 * дровером. При размонтировании хозяина состояние сбрасывается, чтобы
 * следующий открытый лист не мигал данными предыдущего.
 *
 * Чужой лист по идентификатору открывается только администратору и только на
 * просмотр — так он смотрит лист из баг-репорта, даже если ссылкой на него не
 * делились.
 *
 * Побочные эффекты: пишет в общее состояние листа (документ, режим просмотра,
 * токены ссылки) и сбрасывает его при уходе хозяина; получив отказ по чужому
 * листу до загрузки профиля, догружает профиль (`useUser().fetch`), чтобы
 * узнать роль.
 *
 * @param sheetId идентификатор листа (реактивный для панели `?detail=`) либо
 *   токен ссылки при `options.shared`.
 * @param options режим загрузки; по умолчанию — свой лист.
 * @returns статус загрузки и ручной перезапуск.
 */
export function useCharacterSheetLoader(
  sheetId: MaybeRefOrGetter<string>,
  options: SheetLoaderOptions = {},
) {
  const { loadCharacter, resetCharacter, setReadonly } = useCharacterSheet();
  const { setShareToken, setViewedShareToken } = useCharacterSheetShare();
  const { user, isAdmin, fetch: fetchProfile } = useUser();

  const isShared = computed(() => toValue(options.shared ?? false));

  const status = ref<SheetLoadStatus>('idle');

  // Режим просмотра включается до первого рендера тела листа, иначе шапка
  // успеет показать чужому зрителю замок и меню владельца.
  setReadonly(isShared.value ? 'shared' : null);

  /**
   * Может ли зритель прочитать чужой лист как администратор. На странице листа
   * профиль уже загружен гардом, а на странице списка он догружается после
   * монтирования — отказ по чужому листу мог прийти раньше него.
   *
   * @returns true, если у зрителя роль администратора.
   */
  async function canViewAsAdmin(): Promise<boolean> {
    if (!user.value) {
      await fetchProfile();
    }

    return isAdmin.value;
  }

  /**
   * Документ листа и режим его показа. Лист по ссылке читается публичной
   * ручкой. Свой — своей, а чужой она отдаёт как 403: тогда администратор
   * перечитывает его отдельной ручкой на просмотр, остальным отказ уходит
   * дальше и превращается в «не найден».
   *
   * @param requestedSheetId идентификатор листа либо токен ссылки.
   * @param requestedShared лист открыт по ссылке.
   * @returns лист и причина режима просмотра.
   */
  async function fetchSheet(
    requestedSheetId: string,
    requestedShared: boolean,
  ): Promise<LoadedSheet> {
    if (requestedShared) {
      return {
        detail: await fetchSharedCharacterSheet(requestedSheetId),
        readonlyReason: 'shared',
      };
    }

    try {
      return {
        detail: await fetchCharacterSheet(requestedSheetId),
        readonlyReason: null,
      };
    } catch (error) {
      if (
        getFetchStatus(error) !== StatusCodes.FORBIDDEN
        || !(await canViewAsAdmin())
      ) {
        throw error;
      }

      return {
        detail: await fetchCharacterSheetForAdmin(requestedSheetId),
        readonlyReason: 'admin',
      };
    }
  }

  /**
   * Ответ пришёл к уже неактуальному выбору: пока грузили, панель переключилась
   * на другой лист или сменила режим (свой ↔ по ссылке).
   *
   * @param requestedSheetId идентификатор (или токен) на момент запроса.
   * @param requestedShared режим на момент запроса.
   * @returns true, если ответ применять не нужно.
   */
  function isStaleResponse(
    requestedSheetId: string,
    requestedShared: boolean,
  ): boolean {
    return (
      toValue(sheetId) !== requestedSheetId
      || isShared.value !== requestedShared
    );
  }

  /** Загружает лист; пустой идентификатор переводит в `idle` без запроса. */
  async function load(): Promise<void> {
    const currentSheetId = toValue(sheetId);
    const currentShared = isShared.value;

    // Режим фиксируется до запроса: панель могла переключиться со своего листа
    // на чужой, и тело листа не должно успеть показать владельческие действия.
    setReadonly(currentShared ? 'shared' : null);

    if (!currentSheetId) {
      status.value = 'idle';

      return;
    }

    status.value = 'pending';

    try {
      const { detail, readonlyReason } = await fetchSheet(
        currentSheetId,
        currentShared,
      );

      // Пока грузили, могли выбрать другой лист — устаревший ответ не применяем.
      if (isStaleResponse(currentSheetId, currentShared)) {
        return;
      }

      // Режим — раньше документа: что лист чужой и открыт администратором,
      // выясняется только по ответу, а автосейв должен увидеть документ уже в
      // режиме просмотра и не слать PUT в чужой лист.
      setReadonly(readonlyReason);
      loadCharacter(detail.data);
      // У листа по ссылке токена в ответе нет: управление доступом — только у владельца.
      setShareToken(detail.id, detail.shareToken);
      // Зато известен токен, по которому лист открыт, — им меню сохраняет его к себе.
      setViewedShareToken(currentShared ? currentSheetId : null);
      status.value = 'ready';
    } catch (error) {
      if (isStaleResponse(currentSheetId, currentShared)) {
        return;
      }

      const fetchStatus = getFetchStatus(error);

      // Чужой лист бэк отдаёт как 403 — для не-администратора это «не найден».
      status.value =
        fetchStatus === StatusCodes.NOT_FOUND
        || fetchStatus === StatusCodes.FORBIDDEN
          ? 'notFound'
          : 'error';
    }
  }

  onMounted(() => {
    void load();
  });

  // Панель широкого режима: смена выбранного листа (или режима — со своего на
  // чужой по ссылке) перезагружает документ.
  watch([() => toValue(sheetId), isShared], () => {
    void load();
  });

  onScopeDispose(() => {
    resetCharacter();
    setShareToken(null, null);
    setViewedShareToken(null);
    // Режим просмотра снимается вместе со страницей: состояние общее, и
    // следующий свой лист иначе открылся бы нередактируемым.
    setReadonly(null);
  });

  return {
    status,
    load,
  };
}
