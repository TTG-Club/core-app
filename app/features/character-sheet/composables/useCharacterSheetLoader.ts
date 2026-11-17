import type { CharacterSheetDetail, SheetReadonlyReason } from '../model';

import { StatusCodes } from 'http-status-codes';

import { getFetchStatus } from '~initiative/model';

import {
  fetchCharacterSheet,
  fetchCharacterSheetForAdmin,
  fetchSharedCharacterSheet,
  getSheetStateKey,
  parseSheetKey,
} from '../model';
import { useCharacterSheet } from './useCharacterSheet';
import { useCharacterSheetVersion } from './useCharacterSheetAutosave';
import { useCharacterSheetShare } from './useCharacterSheetShare';
import {
  acquireSheetSession,
  isSheetSessionOpen,
  releaseSheetSession,
} from './useSheetSessions';

/** Статус загрузки листа: idle — лист не выбран (пустой идентификатор). */
export type SheetLoadStatus =
  | 'idle'
  | 'pending'
  | 'ready'
  | 'notFound'
  | 'error';

/** Загруженный лист и режим, в котором его показывать. */
interface LoadedSheet {
  detail: CharacterSheetDetail;

  /** Причина режима «только просмотр»; null — лист свой и открыт на правку. */
  readonlyReason: SheetReadonlyReason | null;
}

/**
 * Загрузка сохранённого листа в состояние `useCharacterSheet` его ключа.
 * Используется хостом листа: на странице, в панели широкого режима, в
 * дровере. Один лист может быть открыт сразу в нескольких местах: грузит
 * его первое, остальные показывают уже загруженное — повторная загрузка
 * затёрла бы правки, которые ещё не ушли на сервер. Состояние сбрасывается,
 * когда лист закрыли в последнем месте.
 *
 * Свой лист открывается по идентификатору, чужой — по токену ссылки
 * «поделиться»: тогда он грузится публичной ручкой и открыт на просмотр.
 * Чужой лист по идентификатору открывается только администратору и только на
 * просмотр — так он смотрит лист из баг-репорта, даже если ссылкой на него не
 * делились.
 *
 * Побочные эффекты: пишет в состояние листа (документ, режим просмотра,
 * токен ссылки, версию) и ведёт счёт мест, где лист открыт. Если чужой лист
 * отдан как 403 до загрузки профиля, догружает профиль (`useUser().fetch`),
 * чтобы узнать роль.
 *
 * @param sheetKey ключ открытого листа (`createSheetKey`).
 * @returns статус загрузки и ручной перезапуск.
 */
export function useCharacterSheetLoader(sheetKey: string) {
  const { source, id: sheetId } = parseSheetKey(sheetKey);
  const isShared = source === 'shared';

  const { loadCharacter, resetCharacter, setReadonly, setEditorAccess } =
    useCharacterSheet(sheetKey);

  const { setShareToken } = useCharacterSheetShare();

  const { setSheetVersion } = useCharacterSheetVersion();
  const { user, isAdmin, fetch: fetchProfile } = useUser();

  // Статус общий для всех мест, где лист открыт: второе место не грузит лист
  // заново, а ждёт загрузку первого
  const status = useState<SheetLoadStatus>(
    getSheetStateKey('load-status', sheetKey),
    () => 'idle',
  );

  // Режим просмотра включается до первого рендера тела листа, иначе шапка
  // успеет показать чужому зрителю замок и меню владельца. Лист, уже
  // открытый в другом месте, свой режим знает
  if (acquireSheetSession(sheetKey)) {
    setReadonly(isShared ? 'shared' : null);
  }

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
   * @returns лист и причина режима просмотра.
   */
  async function fetchSheet(): Promise<LoadedSheet> {
    if (isShared) {
      return {
        detail: await fetchSharedCharacterSheet(sheetId),
        readonlyReason: 'shared',
      };
    }

    try {
      return {
        detail: await fetchCharacterSheet(sheetId),
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
        detail: await fetchCharacterSheetForAdmin(sheetId),
        readonlyReason: 'admin',
      };
    }
  }

  /** Загружает лист; пустой идентификатор оставляет `idle` без запроса. */
  async function load(): Promise<void> {
    // Режим фиксируется до запроса: тело листа не должно успеть показать
    // владельческие действия у чужого листа.
    setReadonly(isShared ? 'shared' : null);
    setEditorAccess(false);

    if (!sheetId) {
      status.value = 'idle';

      return;
    }

    status.value = 'pending';

    try {
      const { detail, readonlyReason } = await fetchSheet();

      // Пока грузили, лист закрыли везде — ответ применять некуда.
      if (!isSheetSessionOpen(sheetKey)) {
        return;
      }

      // Режим — раньше документа: что лист чужой и открыт администратором,
      // выясняется только по ответу, а автосейв должен увидеть документ уже в
      // режиме просмотра и не слать PUT в чужой лист.
      setReadonly(readonlyReason);
      // Версия — раньше документа: первая же правка после загрузки должна
      // уйти с ней, иначе сохранение затёрло бы чужое изменение без проверки.
      setSheetVersion(detail.id, detail.version);
      loadCharacter(detail.data);
      // У листа по ссылке токена в ответе нет: управление доступом — только у владельца.
      setShareToken(detail.id, detail.shareToken);
      // Чужой лист по праву редактора: правки разрешены, управление доступом — нет.
      setEditorAccess(detail.editor);
      status.value = 'ready';
    } catch (error) {
      if (!isSheetSessionOpen(sheetKey)) {
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
    // Лист, который уже грузит или показывает другое место, заново не грузится
    if (status.value === 'idle') {
      void load();
    }
  });

  onScopeDispose(() => {
    // Лист ещё открыт в другом месте: его состояние остаётся как есть
    if (!releaseSheetSession(sheetKey)) {
      return;
    }

    resetCharacter();
    status.value = 'idle';
    setEditorAccess(false);
    setReadonly(null);
  });

  return {
    status,
    load,
  };
}
