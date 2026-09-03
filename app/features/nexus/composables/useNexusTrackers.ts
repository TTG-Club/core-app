import type { MaybeRefOrGetter } from 'vue';

import type { NexusSheet, NexusTracker } from '../model';

import { fetchSharedCharacterSheet } from '~character-sheet/model';
import {
  addParticipants,
  buildSheetPlayerOption,
  createTracker,
} from '~initiative/model';

import {
  addNexusTracker,
  fetchNexusTrackers,
  removeNexusTracker,
} from '../model';

/**
 * Трекеры инициативы комнаты.
 *
 * Бой ведётся в разделе трекеров сайта — там бестиарий, порядок ходов и
 * состояния. Комната хранит только ссылку на него, а при создании ставит в
 * бой персонажей, уже выложенных за стол: собирать их заново мастеру незачем.
 *
 * @param nexusId Комната; `null` — не запрашивать.
 */
export function useNexusTrackers(nexusId: MaybeRefOrGetter<string | null>) {
  const currentId = computed(() => toValue(nexusId));

  const {
    data: trackers,
    status,
    refresh,
  } = useAsyncData(
    () => `nexus-trackers-${currentId.value ?? 'none'}`,
    async () => {
      const id = currentId.value;

      return id ? await fetchNexusTrackers(id) : [];
    },
    { watch: [currentId], deep: false, server: false, default: () => [] },
  );

  const isLoading = computed(
    () => status.value !== 'success' && status.value !== 'error',
  );

  /**
   * Ставит в бой персонажа с листа комнаты.
   *
   * Лист читается по ссылке общего доступа: числа он считает сам, и трекеру
   * нужен не весь документ, а имя, хиты, КД и бонус инициативы.
   *
   * @param trackerId Идентификатор трекера.
   * @param sheet Лист персонажа из комнаты.
   */
  async function addSheetPlayer(
    trackerId: string,
    sheet: NexusSheet,
  ): Promise<void> {
    const detail = await fetchSharedCharacterSheet(sheet.shareToken);

    const option = buildSheetPlayerOption(detail.data, {
      sheetId: detail.id,
      source: 'saved',
      shareToken: sheet.shareToken,
      savedId: null,
    });

    await addParticipants(trackerId, {
      type: 'PLAYER',
      name: option.name,
      initiativeBonus: option.initiativeBonus,
      armorClass: option.armorClass,
      maxHitPoints: option.maxHitPoints,
      currentHitPoints: option.currentHitPoints,
      sheetLink: {
        sheetId: option.sheetId,
        source: option.source,
        shareToken: option.shareToken,
        savedId: option.savedId ?? null,
        avatarUrl: option.avatarUrl,
      },
    });
  }

  /**
   * Заводит бой: создаёт трекер, привязывает его к комнате и ставит в него
   * персонажей со стола.
   *
   * Лист, который не открылся, бой не срывает: остальные персонажи всё равно
   * встают в строй, а недостающего мастер добавит руками.
   *
   * @param title Название боя.
   * @param sheets Листы, выложенные в комнату.
   * @returns Заведённый трекер.
   */
  async function create(
    title: string,
    sheets: ReadonlyArray<NexusSheet>,
  ): Promise<NexusTracker> {
    const id = currentId.value;

    if (!id) {
      throw new Error('Комната не выбрана');
    }

    const created = await createTracker(title);

    for (const sheet of sheets) {
      try {
        await addSheetPlayer(created.id, sheet);
      } catch {
        // Лист мог остаться без доступа: бой из-за этого не отменяется.
      }
    }

    const tracker = await addNexusTracker(id, {
      trackerId: created.id,
      title,
    });

    await refresh();

    return tracker;
  }

  /**
   * Убирает трекер из комнаты; сам бой остаётся в разделе трекеров.
   * @param trackerRecordId Идентификатор записи трекера в комнате.
   */
  async function remove(trackerRecordId: string): Promise<void> {
    const id = currentId.value;

    if (!id) {
      return;
    }

    await removeNexusTracker(id, trackerRecordId);

    await refresh();
  }

  return {
    trackers: trackers as Ref<Array<NexusTracker>>,
    status,
    isLoading,

    create,
    refresh,
    remove,
  };
}
