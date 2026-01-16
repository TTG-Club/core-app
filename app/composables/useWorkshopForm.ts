import { cloneDeep, isEqual, merge } from 'lodash-es';

import type { FetchResponse } from 'ofetch';

import type { FormErrorEvent } from '#ui/types';

export interface WorkshopFormOptions<T> {
  actionUrl: string;
  getInitialState: () => T;
}

export function useWorkshopForm<T extends Record<string, any>>(
  options: WorkshopFormOptions<T>,
) {
  const _options = toValue(options);
  const $toast = useToast();
  const route = useRoute();
  const router = useRouter();

  const state = useState<T>(_options.getInitialState);
  const prevState = useState<T>(_options.getInitialState);

  const isEditForm = computed(() => !!route.params.url);

  const actionUrl = computed(() => {
    if (isEditForm.value) {
      return `${_options.actionUrl}/${route.params.url}`;
    }

    return _options.actionUrl;
  });

  const isFormEdited = computed(
    () => !isEqual(toRaw(prevState.value), toRaw(state.value)),
  );

  const { refresh: reset } = useAsyncData(async () => {
    if (isEditForm.value) {
      try {
        const resp = await $fetch<T>(`${actionUrl.value}/raw`);
        const merged = merge({}, _options.getInitialState(), resp);

        state.value = cloneDeep(merged);
        prevState.value = cloneDeep(merged);
      } catch (error) {
        consola.error(error);

        $toast.add({
          title: 'Ошибка данных',
          description: 'При попытке отобразить форму произошла ошибка',
          color: 'error',
          actions: [
            {
              icon: 'i-ttg-center-axis',
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
        body: toValue(state),
        onResponse,
      });
    } catch (err) {
      $toast.add({
        title: 'Ошибка сохранения',
        description: 'При попытке отправить форму произошла ошибка',
        color: 'error',
      });

      consola.error(err);
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
    prevState,

    isFormEdited,

    onSubmit,
    onError,

    reset: () => reset(),
  };
}
