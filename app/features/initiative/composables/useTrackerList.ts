import type { TrackerDetailed, TrackerListItem } from '~initiative/model';

import {
  createTracker,
  deleteTracker,
  fetchTrackerLimits,
  fetchTrackerList,
  getTrackerErrorMessage,
  MAX_AUTHORIZED_TRACKERS,
  updateTracker,
} from '~initiative/model';

/**
 * Список трекеров авторизованного пользователя: активные + история удалённых.
 *
 * За один запрос (`includeDeleted=true`) получаем весь набор и делим его на
 * активные и удалённые по флагу `deleted`. Все операции клиентские
 * (страница обёрнута в `<ClientOnly>`), поэтому Bearer-токен подставляет
 * серверный прокси из куки.
 */
export function useTrackerList() {
  const toast = useToast();

  const trackers = ref<Array<TrackerListItem>>([]);
  const isLoading = ref(false);
  const isMutating = ref(false);
  const loadError = ref<unknown>(null);

  const activeTrackers = computed(() =>
    trackers.value.filter((tracker) => !tracker.deleted),
  );

  const deletedTrackers = computed(() =>
    trackers.value.filter((tracker) => tracker.deleted),
  );

  // Лимит приходит с сервера: он зависит от подписки. До ответа и при ошибке
  // остаётся базовый, а подсказка о подписке не показывается.
  const limit = ref(MAX_AUTHORIZED_TRACKERS);
  const subscriberLimit = ref(0);

  const canCreate = computed(() => activeTrackers.value.length < limit.value);

  /** Подписка прибавит боёв — значит, есть что предложить. */
  const canRaiseLimit = computed(() => subscriberLimit.value > limit.value);

  /**
   * Показывает тост с ошибкой (текст берётся из ответа бэка).
   * @param error Пойманная ошибка.
   * @param title Заголовок тоста.
   */
  function notifyError(error: unknown, title: string): void {
    toast.add({
      title,
      description: getTrackerErrorMessage(error),
      color: 'error',
      icon: 'tabler:alert-triangle',
    });
  }

  /**
   * Загружает лимит трекеров. Ошибка не мешает списку: остаётся прежний лимит,
   * а окончательное слово при создании всё равно за сервером.
   */
  async function loadLimits(): Promise<void> {
    try {
      const limits = await fetchTrackerLimits();

      limit.value = limits.limit;
      subscriberLimit.value = limits.subscriberLimit;
    } catch {
      // Лимит не критичен для показа списка — оставляем прежние значения.
    }
  }

  /**
   * Загружает список трекеров (включая удалённые для истории).
   */
  async function load(): Promise<void> {
    isLoading.value = true;
    loadError.value = null;

    try {
      const [list] = await Promise.all([fetchTrackerList(true), loadLimits()]);

      trackers.value = list;
    } catch (error) {
      loadError.value = error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Создаёт трекер и обновляет список. Возвращает созданный трекер или null.
   * @param name Имя трекера (опционально).
   */
  async function create(name?: string): Promise<TrackerDetailed | null> {
    isMutating.value = true;

    try {
      const created = await createTracker(name);

      await load();

      return created;
    } catch (error) {
      notifyError(error, 'Не удалось создать трекер');

      return null;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Переименовывает трекер и обновляет список.
   * @param id Идентификатор трекера.
   * @param name Новое имя.
   */
  async function rename(id: string, name: string): Promise<boolean> {
    isMutating.value = true;

    try {
      await updateTracker(id, { name });
      await load();

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось переименовать трекер');

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  /**
   * Удаляет трекер (мягко — уходит в историю) и обновляет список.
   * @param id Идентификатор трекера.
   */
  async function remove(id: string): Promise<boolean> {
    isMutating.value = true;

    try {
      await deleteTracker(id);
      await load();

      return true;
    } catch (error) {
      notifyError(error, 'Не удалось удалить трекер');

      return false;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    trackers,
    activeTrackers,
    deletedTrackers,
    limit,
    subscriberLimit,
    canCreate,
    canRaiseLimit,
    isLoading,
    isMutating,
    loadError,

    load,
    create,
    rename,
    remove,
  };
}
