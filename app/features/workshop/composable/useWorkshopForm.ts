import type { FetchResponse } from 'ofetch';

import type { FormErrorEvent } from '#ui/types';

import { cloneDeep, isEqual, toMerged } from 'es-toolkit';

import { useEntityRevisions } from '../revision/composable';

export interface WorkshopFormOptions<T> {
  actionUrl: string;
  getInitialState: () => T;
  revisionEntityType?: string;
  /**
   * Нормализует загруженные с сервера raw-данные перед слиянием с начальным состоянием.
   * Используется для миграции старых записей и приведения данных к актуальной структуре.
   */
  normalizeLoaded?: (raw: Record<string, unknown>) => Record<string, unknown>;
  /**
   * Трансформирует состояние формы перед отправкой на сервер.
   * Используется для очистки пустых полей, нормализации вложенных объектов и т.д.
   */
  transformBeforeSubmit?: (state: T) => T;
}

/**
 * Проверяет, является ли значение объектом (Record<string, unknown>).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Нормализует загруженный снимок и объединяет его с актуальной структурой формы.
 */
function createLoadedState<T extends { url: string }>(
  options: WorkshopFormOptions<T>,
  rawState: Record<string, unknown>,
): T {
  const normalizedState = options.normalizeLoaded
    ? options.normalizeLoaded(rawState)
    : rawState;

  return cloneDeep(toMerged(options.getInitialState(), normalizedState));
}

export function useWorkshopForm<T extends { url: string }>(
  options: WorkshopFormOptions<T>,
) {
  const _options = toValue(options);
  const $toast = useToast();
  const route = useRoute();
  const router = useRouter();
  const { isAdmin } = useUserRoles();

  const state = useState<T>(_options.getInitialState);
  const previousState = useState<T>(_options.getInitialState);

  /**
   * Подставляет нормализованный снимок ревизии в текущее состояние формы.
   */
  function applyRevisionSnapshot(snapshot: Record<string, unknown>): void {
    state.value = createLoadedState(_options, snapshot);
  }

  const entityId = computed(() =>
    typeof route.params.url === 'string' && route.params.url
      ? route.params.url
      : undefined,
  );

  const isEditForm = computed(() => entityId.value !== undefined);

  const actionUrl = computed(() => {
    if (isEditForm.value) {
      return `${_options.actionUrl}/${entityId.value}`;
    }

    return _options.actionUrl;
  });

  const isFormEdited = computed(
    () => !isEqual(toRaw(previousState.value), toRaw(state.value)),
  );

  const { revisionControl, refreshRevisions, clearSelectedRevision } =
    useEntityRevisions({
      entityType: _options.revisionEntityType,
      entityId,
      enabled: computed(
        () =>
          isAdmin.value
          && isEditForm.value
          && _options.revisionEntityType !== undefined,
      ),
      applySnapshot: applyRevisionSnapshot,
    });

  // Тело, которое реально уходит на сервер при сохранении (после нормализации).
  // Предпросмотр обязан слать РОВНО его же — иначе `/preview` видит сырое
  // состояние формы (пустые массивы, полупустой effect и т.п.), которое бэкенд
  // при сохранении не получает, и предпросмотр падает там, где сохранение живёт.
  const submitState = computed<T>(() =>
    _options.transformBeforeSubmit
      ? _options.transformBeforeSubmit(toValue(state))
      : toValue(state),
  );

  const { refresh: reset } = useAsyncData(async () => {
    if (isEditForm.value) {
      try {
        const rawResponse = await $fetch<T>(`${actionUrl.value}/raw`);

        const rawData = isRecord(rawResponse) ? rawResponse : {};

        const loadedState = createLoadedState(_options, rawData);

        state.value = loadedState;
        previousState.value = cloneDeep(loadedState);
        clearSelectedRevision();
        await refreshRevisions();
      } catch (error) {
        consola.error(error);

        $toast.add({
          title: 'Ошибка данных',
          description: 'При попытке отобразить форму произошла ошибка',
          color: 'error',
          actions: [
            {
              icon: 'tabler:reload',
              label: 'Перезагрузить',
              onClick: withModifiers(reset, ['left', 'exact', 'prevent']),
            },
          ],
        });
      }
    }
  });

  async function onSubmit(): Promise<void> {
    if (!isFormEdited.value) {
      consola.error('[useWorkshopForm] Nothing to save!');

      $toast.add({
        title: 'Нечего сохранять',
        description: 'Отредактируй форму, чтобы выполнить сохранение',
        color: 'warning',
      });

      return Promise.resolve();
    }

    try {
      await $fetch(toValue(actionUrl), {
        method: toValue(isEditForm) ? 'put' : 'post',
        body: toValue(submitState),
        onResponse,
      });
    } catch (error) {
      $toast.add({
        title: 'Ошибка сохранения',
        description: 'При попытке отправить форму произошла ошибка',
        color: 'error',
      });

      consola.error(error);
    }

    return Promise.resolve();
  }

  async function onResponse({ response }: { response: FetchResponse<string> }) {
    if (!response.ok) {
      $toast.add({
        title: 'Ошибка сохранения',
        description: 'При попытке отправить форму произошла ошибка',
        color: 'error',
      });

      consola.error('[useWorkshopForm] Error on response');

      return;
    }

    if (!response._data) {
      $toast.add({
        title: 'Ошибка ответа сервера',
        description:
          'Возможно форма сохранилась, но пришел некорректный ответ сервера...',
        color: 'error',
      });

      consola.error('[useWorkshopForm] Incorrect response from server');

      await reset();

      return;
    }

    $toast.add({
      title: 'Сохранено',
      description: 'Запись успешно сохранена!',
      color: 'success',
    });

    if (!isEditForm.value) {
      return;
    }

    if (response._data === state.value.url) {
      await reset();
    } else {
      await router.replace({ params: { url: response._data } });
    }
  }

  function onError(error: FormErrorEvent) {
    consola.error(error);

    $toast.add({
      title: 'Ошибка валидации',
      description: 'Некоторые поля формы заполнены с ошибкой',
      color: 'error',
    });
  }

  return {
    state,
    previousState,
    submitState,

    isFormEdited,
    revisionControl,

    onSubmit,
    onError,
    reset: () => reset(),
  };
}
