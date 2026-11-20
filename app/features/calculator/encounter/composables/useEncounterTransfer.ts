import type { ComputedRef } from 'vue';

import type { EncounterCreature, EncounterTransferTracker } from '../model';

import { USER_TOKEN_COOKIE } from '#shared/consts';
import { useInitiativeStorage } from '~initiative/composables';
import {
  addParticipants,
  countParticipantsByType,
  createTracker,
  fetchTracker,
  fetchTrackerList,
  getFetchStatus,
  getTrackerErrorMessage,
  INITIATIVE_TOOL_ROUTE,
  MAX_AUTHORIZED_TRACKERS,
  MAX_CREATURES,
} from '~initiative/model';

import {
  countCustomCreatures,
  getTransferBatches,
  TRANSFER_LABELS,
} from '../model';

/** Трекер, куда пойдут существа, и ключ доступа анонимного владельца. */
interface ResolvedTracker {
  id: string;
  accessKey?: string;

  /** Сколько существ в трекере уже есть. */
  creatureCount: number;
}

/**
 * Статусы, при которых сохранённый анонимный трекер больше недоступен:
 * удалён или ключ к нему не подходит. Слот такого трекера надо освободить.
 */
const LOST_TRACKER_STATUSES = new Set([401, 403, 404]);

/**
 * Перенос существ калькулятора столкновений в трекер инициативы: новый или
 * один из уже собранных.
 *
 * Авторизованный пользователь выбирает из своих трекеров. Аноним владеет
 * одним трекером (его ключ лежит в localStorage): переносить можно в него, а
 * если его нет или он пропал — в новый.
 * @param creatures Существа калькулятора.
 */
export function useEncounterTransfer(
  creatures: ComputedRef<Array<EncounterCreature>>,
) {
  const toast = useToast();
  const token = useCookie<string | null>(USER_TOKEN_COOKIE);
  const { slot, saveSlot, clearSlot } = useInitiativeStorage();

  const isAuthorized = computed(() => Boolean(token.value));

  const trackers = ref<Array<EncounterTransferTracker>>([]);
  const isLoading = ref(false);
  const isTransferring = ref(false);
  const loadError = ref<string>();

  const batches = computed(() => getTransferBatches(creatures.value));

  const transferCount = computed(() =>
    batches.value.reduce((sum, { count }) => sum + count, 0),
  );

  // Своих монстров бэкенд трекера не принимает (нужен `creatureUrl`
  // бестиария) — их пропускаем и говорим об этом в окне переноса.
  const skippedCount = computed(() => countCustomCreatures(creatures.value));

  // Аноним не заводит второй трекер, пока жив первый; у авторизованного —
  // общий лимит трекеров.
  const canCreate = computed(() =>
    isAuthorized.value
      ? trackers.value.length < MAX_AUTHORIZED_TRACKERS
      : trackers.value.length === 0,
  );

  const createLimitHint = computed(() =>
    isAuthorized.value
      ? TRANSFER_LABELS.newTrackerLimit
      : TRANSFER_LABELS.anonymousLimit,
  );

  /**
   * Загружает трекеры, в которые можно перенести существ.
   */
  async function loadTrackers(): Promise<void> {
    isLoading.value = true;
    loadError.value = undefined;

    try {
      if (isAuthorized.value) {
        const list = await fetchTrackerList();

        trackers.value = list
          .filter(({ deleted }) => !deleted)
          .map(({ id, name, status }) => ({
            id,
            name,
            isActive: status === 'ACTIVE',
          }));

        return;
      }

      trackers.value = [];

      if (!slot.value) {
        return;
      }

      const tracker = await fetchTracker(
        slot.value.trackerId,
        slot.value.accessKey,
      );

      trackers.value = [
        {
          id: tracker.id,
          name: tracker.name,
          isActive: tracker.status === 'ACTIVE',
        },
      ];
    } catch (error) {
      if (
        !isAuthorized.value
        && LOST_TRACKER_STATUSES.has(getFetchStatus(error) ?? 0)
      ) {
        clearSlot();

        return;
      }

      loadError.value = getTrackerErrorMessage(error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Находит или создаёт трекер для переноса.
   * @param trackerId Идентификатор существующего трекера; нет — создать новый.
   * @param name Имя нового трекера; пусто — имя по умолчанию.
   */
  async function resolveTracker(
    trackerId: string | undefined,
    name: string,
  ): Promise<ResolvedTracker> {
    if (!trackerId) {
      const created = await createTracker(name.trim() || undefined);

      if (created.accessKey) {
        saveSlot(created.id, created.accessKey);
      }

      return {
        id: created.id,
        accessKey: created.accessKey,
        creatureCount: 0,
      };
    }

    const accessKey =
      slot.value?.trackerId === trackerId ? slot.value.accessKey : undefined;

    const tracker = await fetchTracker(trackerId, accessKey);

    return {
      id: tracker.id,
      accessKey,
      creatureCount: countParticipantsByType(tracker.participants, 'CREATURE'),
    };
  }

  /**
   * Сообщает, что существа в трекер не поместятся.
   * @param free Сколько мест для существ осталось.
   */
  function notifyCapacity(free: number): void {
    toast.add({
      title: TRANSFER_LABELS.capacityTitle,
      description: `В трекере может быть не больше ${MAX_CREATURES} существ, свободно ${free}, а переносится ${transferCount.value}.`,
      color: 'warning',
      icon: 'tabler:alert-triangle',
    });
  }

  /**
   * Переносит существ и открывает трекер.
   * @param trackerId Идентификатор существующего трекера; нет — новый трекер.
   * @param name Имя нового трекера.
   * @returns Удалось ли перенести всех существ.
   */
  async function transfer(
    trackerId: string | undefined,
    name = '',
  ): Promise<boolean> {
    // Новый трекер с заведомо лишними существами создавать незачем.
    if (!trackerId && transferCount.value > MAX_CREATURES) {
      notifyCapacity(MAX_CREATURES);

      return false;
    }

    isTransferring.value = true;

    let target: ResolvedTracker | undefined;
    let added = 0;

    try {
      target = await resolveTracker(trackerId, name);

      const free = MAX_CREATURES - target.creatureCount;

      if (transferCount.value > free) {
        notifyCapacity(free);

        return false;
      }

      for (const { creatureUrl, count } of batches.value) {
        await addParticipants(
          target.id,
          { type: 'CREATURE', creatureUrl, count },
          target.accessKey,
        );

        added += count;
      }

      await navigateTo(`${INITIATIVE_TOOL_ROUTE}/${target.id}`);

      return true;
    } catch (error) {
      consola.error('Ошибка переноса существ в трекер инициативы:', error);

      toast.add({
        title: added
          ? TRANSFER_LABELS.partialTitle
          : TRANSFER_LABELS.errorTitle,
        description: added
          ? `Перенесено ${added} из ${transferCount.value}. ${getTrackerErrorMessage(error)}`
          : getTrackerErrorMessage(error),
        color: 'error',
        icon: 'tabler:alert-triangle',
      });

      // Часть существ уже в трекере — открываем его, чтобы мастер видел, что
      // успело добавиться.
      if (target && added) {
        await navigateTo(`${INITIATIVE_TOOL_ROUTE}/${target.id}`);
      }

      return false;
    } finally {
      isTransferring.value = false;
    }
  }

  return {
    trackers,
    isAuthorized,
    canCreate,
    createLimitHint,
    transferCount,
    skippedCount,
    isLoading,
    isTransferring,
    loadError,

    loadTrackers,
    transfer,
  };
}
