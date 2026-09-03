import type { MaybeRefOrGetter } from 'vue';

import type { NexusSheet } from '../model';

import {
  addNexusSheet,
  fetchNexusSheets,
  removeNexusSheet,
  transferNexusSheet,
} from '../model';

/**
 * Листы персонажей, выложенные в комнату.
 *
 * @param nexusId Комната; `null` — не запрашивать.
 */
export function useNexusSheets(nexusId: MaybeRefOrGetter<string | null>) {
  const currentId = computed(() => toValue(nexusId));

  const {
    data: sheets,
    status,
    refresh,
  } = useAsyncData(
    () => `nexus-sheets-${currentId.value ?? 'none'}`,
    async () => {
      const id = currentId.value;

      return id ? await fetchNexusSheets(id) : [];
    },
    { watch: [currentId], deep: false, server: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Выкладывает лист в комнату.
   * @param shareToken Токен общего доступа листа.
   * @param characterName Подпись персонажа.
   */
  async function add(shareToken: string, characterName: string): Promise<void> {
    const id = currentId.value;

    if (!id) {
      return;
    }

    await addNexusSheet(id, { shareToken, characterName });

    await refresh();
  }

  /**
   * Убирает лист из комнаты.
   * @param sheetId Идентификатор листа в комнате.
   */
  async function remove(sheetId: string): Promise<void> {
    const id = currentId.value;

    if (!id) {
      return;
    }

    await removeNexusSheet(id, sheetId);

    await refresh();
  }

  /**
   * Передаёт лист другому участнику.
   * @param sheetId Идентификатор листа в комнате.
   * @param ownerId Кому переходит лист.
   */
  async function transfer(sheetId: string, ownerId: string): Promise<void> {
    const id = currentId.value;

    if (!id) {
      return;
    }

    await transferNexusSheet(id, sheetId, ownerId);

    await refresh();
  }

  return {
    sheets: sheets as Ref<Array<NexusSheet>>,
    status,
    isLoading,

    add,
    refresh,
    remove,
    transfer,
  };
}
