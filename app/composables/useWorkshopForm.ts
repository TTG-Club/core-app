import type { FormErrorEvent } from '#ui/types';
import { cloneDeep, isEqual, merge } from 'lodash-es';
import type { CreatureDetailResponse } from '~bestiary/types';
import type { FetchResponse } from 'ofetch';

export type WorkshopFormOptions<T> = MaybeRefOrGetter<{
  actionUrl: string;
  getInitialState: () => T;
}>;

export async function useWorkshopForm<T extends Record<string, any>>(
  options: WorkshopFormOptions<T>,
) {
  const _options = toValue(options);
  const $toast = useToast();
  const route = useRoute();
  const router = useRouter();

  const state = useState<T>(_options.getInitialState);
  const prevState = useState<T>(_options.getInitialState);
  const isPreviewShowed = useState<boolean>(() => false);

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
    const mutatedState = _options.getInitialState();

    if (isEditForm.value) {
      try {
        const resp = await $fetch<T>(`${actionUrl.value}/raw`);

        merge(mutatedState, resp);
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

    state.value = cloneDeep(mutatedState);
    prevState.value = cloneDeep(mutatedState);
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

  const {
    data: preview,
    status,
    execute: loadPreview,
    clear,
  } = await useFetch<CreatureDetailResponse>(
    computed(() => `${_options.actionUrl}/preview`),
    {
      method: 'POST',
      body: state,
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  function showPreview() {
    isPreviewShowed.value = true;
  }

  watch(isPreviewShowed, (value) => {
    clear();

    if (!value) {
      return;
    }

    loadPreview();
  });

  return {
    state,
    prevState,
    preview,

    isFormEdited,
    isPreviewShowed,
    isPreviewLoading: computed(() => status.value === 'pending'),
    isPreviewError: computed(() => status.value === 'error'),

    onSubmit,
    onError,

    reset,
    showPreview,
  };
}
