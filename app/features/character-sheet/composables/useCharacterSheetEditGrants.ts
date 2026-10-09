import type { ComputedRef } from 'vue';

import type { SavedSheetEditAccess } from '../model';

import { createSharedComposable } from '@vueuse/core';

import {
  CHARACTER_SHEET_ROUTE,
  fetchSavedSheetEditAccess,
  SHEET_EDIT_ACCESS_DATA_KEY,
  SHEET_EDIT_ACCESS_POLL_INTERVAL_MS,
  SHEET_EDIT_DECLINED_TOAST,
  SHEET_EDIT_GRANTED_TOAST,
  SHEET_EDIT_REQUESTS_POLL_COOLDOWN_MS,
  SHEET_EDIT_REQUESTS_POLL_MAX_BACKOFF_MS,
  SHEET_SEEN_EDIT_GRANTS_STORAGE_KEY,
} from '../model';
import { useCharacterSheetSaved } from './useCharacterSheetSaved';

/** Описание возвращаемого значения композабла useCharacterSheetEditGrants. */
export interface UseCharacterSheetEditGrantsReturn {
  /** Есть разрешения на правку, о которых пользователь ещё не знает. */
  hasUnseenGrants: ComputedRef<boolean>;

  /** Отметить все выданные разрешения как увиденные (точка у шлема гаснет). */
  markGrantsSeen: () => void;
}

/**
 * Разрешил ли владелец правки в этой записи.
 *
 * @param access право на редактирование сохранённого листа.
 * @returns true, если правки разрешены.
 */
function isApproved(access: SavedSheetEditAccess): boolean {
  return access.status === 'APPROVED';
}

/**
 * Ответы владельцев на запросы правок — у того, кто просил: тост «Редактирование
 * разрешено» или «В редактировании отказано», точка у шлема, пока разрешение
 * не увидено, и свежий раздел «Другие листы» без F5 (после отказа кнопка
 * запроса сразу снова доступна).
 *
 * Обёрнут в `createSharedComposable`: потребители — меню шлема и раздел
 * «Другие листы», а опрос нужен один. Сводка опрашивается только пока есть
 * запрос без ответа — новых разрешений без запроса не бывает.
 *
 * @returns признак новых разрешений и их отметка увиденными.
 */
function createCharacterSheetEditGrants(): UseCharacterSheetEditGrantsReturn {
  const { isLoggedIn } = useUser();
  const toast = useToast();

  const { savedSheets, load: loadSaved } = useCharacterSheetSaved();

  const seenGrants = useLocalStorage<string[]>(
    SHEET_SEEN_EDIT_GRANTS_STORAGE_KEY,
    [],
  );

  // server: false — приватные данные пользователя грузим на клиенте. Вход и
  // выход перечитывают сводку сами.
  const { data, error, refresh } = useAsyncData<SavedSheetEditAccess[]>(
    SHEET_EDIT_ACCESS_DATA_KEY,
    () =>
      isLoggedIn.value ? fetchSavedSheetEditAccess() : Promise.resolve([]),
    { server: false, watch: [isLoggedIn] },
  );

  // Ждём ответа владельца — по сводке либо по разделу «Другие листы», где
  // запрос только что отправили и сводка о нём ещё не знает.
  const hasPendingRequests = computed(
    () =>
      (data.value ?? []).some((access) => access.status === 'PENDING')
      || savedSheets.value.some((sheet) => sheet.editStatus === 'PENDING'),
  );

  const unseenGrants = computed(() =>
    (data.value ?? []).filter(
      (access) =>
        isApproved(access) && !seenGrants.value.includes(access.sheetId),
    ),
  );

  const hasUnseenGrants = computed(() => unseenGrants.value.length > 0);

  // О каждом разрешении сообщаем тостом один раз за сессию, даже если
  // точку у шлема ещё не погасили.
  const notifiedGrants = new Set<string>();

  /**
   * Тост о новом разрешении со ссылкой на лист.
   *
   * @param access выданное право.
   */
  function notifyGranted(access: SavedSheetEditAccess): void {
    notifiedGrants.add(access.sheetId);

    toast.add({
      title: SHEET_EDIT_GRANTED_TOAST.title,
      description: `«${access.name}» ${SHEET_EDIT_GRANTED_TOAST.descriptionSuffix}`,
      color: 'success',
      icon: 'tabler:pencil',
      actions: [
        {
          label: SHEET_EDIT_GRANTED_TOAST.action,
          onClick: () =>
            navigateTo(`${CHARACTER_SHEET_ROUTE}/${access.sheetId}`),
        },
      ],
    });
  }

  /**
   * Тост об отказе. Отказ записи не оставляет — о нём узнаём по пропаже
   * ждавшего ответа запроса.
   *
   * @param name название листа.
   */
  function notifyDeclined(name: string): void {
    toast.add({
      title: SHEET_EDIT_DECLINED_TOAST.title,
      description: `«${name}»: ${SHEET_EDIT_DECLINED_TOAST.descriptionSuffix}`,
      color: 'warning',
      icon: 'tabler:pencil-off',
    });
  }

  /**
   * Перечитывает «Другие листы» и сообщает об отказах: запросы, которые и
   * после перечитывания больше не ждут ответа и не разрешены, отклонены.
   * Перечитывание отсеивает гонку с только что отправленным запросом, которого
   * сводка ещё не видела.
   *
   * @param candidateIds сохранённые листы, чей запрос пропал из сводки.
   */
  async function reloadSaved(candidateIds: string[]): Promise<void> {
    await loadSaved();

    savedSheets.value
      .filter(
        (sheet) => candidateIds.includes(sheet.id) && sheet.editStatus === null,
      )
      .forEach((sheet) => notifyDeclined(sheet.name));
  }

  /** Отметить все выданные разрешения как увиденные. */
  function markGrantsSeen(): void {
    const approvedIds = (data.value ?? [])
      .filter(isApproved)
      .map((access) => access.sheetId);

    if (approvedIds.every((sheetId) => seenGrants.value.includes(sheetId))) {
      return;
    }

    seenGrants.value = [...new Set([...seenGrants.value, ...approvedIds])];
  }

  // Ответ владельца: тост о новом разрешении и свежий раздел «Другие листы»,
  // если он уже загружен и показывает прежнее право. Цикла нет: загрузка
  // раздела сводку не трогает.
  watch(data, (accesses, previousAccesses) => {
    (accesses ?? [])
      .filter(
        (access) =>
          isApproved(access)
          && !seenGrants.value.includes(access.sheetId)
          && !notifiedGrants.has(access.sheetId),
      )
      .forEach(notifyGranted);

    const isSavedOutdated = (accesses ?? []).some((access) =>
      savedSheets.value.some(
        (sheet) =>
          sheet.id === access.savedId && sheet.editStatus !== access.status,
      ),
    );

    const currentIds = new Set(
      (accesses ?? []).map((access) => access.savedId),
    );

    // Ждал ответа, а в свежей сводке его нет — запрос отклонили.
    const declinedCandidateIds = [
      ...(previousAccesses ?? [])
        .filter((access) => access.status === 'PENDING')
        .map((access) => access.savedId),
      ...savedSheets.value
        .filter((sheet) => sheet.editStatus === 'PENDING')
        .map((sheet) => sheet.id),
    ].filter((savedId) => !currentIds.has(savedId));

    if (declinedCandidateIds.length) {
      void reloadSaved([...new Set(declinedCandidateIds)]);
    } else if (isSavedOutdated) {
      void loadSaved();
    }
  });

  useBackgroundRefresh({
    refresh: () => (hasPendingRequests.value ? refresh() : Promise.resolve()),
    shouldBackoff: () => !!error.value,
    intervalMs: SHEET_EDIT_ACCESS_POLL_INTERVAL_MS,
    cooldownMs: SHEET_EDIT_REQUESTS_POLL_COOLDOWN_MS,
    maxBackoffMs: SHEET_EDIT_REQUESTS_POLL_MAX_BACKOFF_MS,
  });

  return {
    hasUnseenGrants,
    markGrantsSeen,
  };
}

export const useCharacterSheetEditGrants = createSharedComposable(
  createCharacterSheetEditGrants,
);
