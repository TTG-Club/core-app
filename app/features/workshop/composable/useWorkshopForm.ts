import type { FetchResponse } from 'ofetch';

import type { FormErrorEvent } from '#ui/types';

import { cloneDeep, isEqual, toMerged } from 'es-toolkit';
import { FetchError } from 'ofetch';

import { useEntityRevisions } from '../revision/composable';

const SUBMIT_ERROR_DESCRIPTION = 'При попытке отправить форму произошла ошибка';

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
  /**
   * Маршрут страницы редактирования по url созданной записи. Если задан, после
   * успешного создания форма переводится в режим редактирования (replace на
   * страницу записи): без этого поздние правки не сохраняются — повторный
   * сабмит уходит POST-ом и падает на занятом url.
   */
  getEditRoute?: (url: string) => string;
}

/**
 * Проверяет, является ли значение объектом (Record<string, unknown>).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Достаёт объяснение ошибки сохранения из ответа бэкенда.
 *
 * Бэкенд отдаёт `{ status, error, message }`, и на 4xx в `message` лежит текст
 * для пользователя («Предмет с url ... уже существует»). На 5xx туда попадает
 * технический текст (SQL, стек), поэтому наружу отдаём общую формулировку.
 */
function getSubmitErrorDescription(error: unknown): string {
  if (!(error instanceof FetchError)) {
    return SUBMIT_ERROR_DESCRIPTION;
  }

  const status = error.statusCode ?? 0;

  if (status < 400 || status >= 500) {
    return SUBMIT_ERROR_DESCRIPTION;
  }

  const message = error.data?.message;

  return typeof message === 'string' && message.trim().length > 0
    ? message
    : SUBMIT_ERROR_DESCRIPTION;
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

  // Сравниваем состояния как есть, без `toRaw()`: снятие прокси лишало computed
  // зависимостей от вложенных полей — он отслеживал только сами ref'ы, которые
  // меняются лишь при загрузке записи. Из-за этого результат «замерзал» после
  // первого вычисления (первый клик по «Сохранить»), и дальше форма отвечала
  // «Нечего сохранять» на любые правки до перезагрузки страницы.
  const isFormEdited = computed(
    () => !isEqual(previousState.value, state.value),
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
    } else {
      // Режим создания: `state`/`previousState` живут в useState всю сессию SPA,
      // поэтому форма может держать данные предыдущей открытой записи. Явно
      // сбрасываем к начальному состоянию — иначе «Создать» открывается
      // предзаполненным прошлой записью (в edit-режиме это делает загрузка /raw).
      const initialState = _options.getInitialState();

      state.value = initialState;
      previousState.value = cloneDeep(initialState);
      clearSelectedRevision();
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
        description: getSubmitErrorDescription(error),
        color: 'error',
      });

      consola.error(error);
    }

    return Promise.resolve();
  }

  async function onResponse({ response }: { response: FetchResponse<string> }) {
    if (!response.ok) {
      // Тост не показываем: `$fetch` следом бросит FetchError, и его поймает
      // catch в onSubmit — там же есть тело ответа с текстом ошибки. Иначе
      // пользователь получал два одинаковых тоста на одну неудачу.
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
      // Создание: переводим форму на страницу записи (edit-режим), если фича
      // сообщила свой маршрут. Страница редактирования перезагрузит состояние
      // из /raw, и дальнейшие сохранения пойдут PUT-ом.
      if (_options.getEditRoute) {
        await router.replace(_options.getEditRoute(response._data));
      }

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
