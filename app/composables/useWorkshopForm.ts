import type { FormErrorEvent } from '#ui/types';
import { cloneDeep, isEqual, merge } from 'lodash-es';
import type { CreatureDetailResponse } from '~bestiary/types';

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

  const state = useState<T>(_options.getInitialState);
  const prevState = useState<T>(_options.getInitialState);
  const isPreviewShowed = useState<boolean>(() => false);

  const isEdit = computed(() => !!route.params.url);

  const actionUrl = computed(() => {
    if (isEdit.value) {
      return `${_options.actionUrl}/${route.params.url}`;
    }

    return _options.actionUrl;
  });

  const isEdited = computed(
    () => !isEqual(toRaw(prevState.value), toRaw(state.value)),
  );

  const { refresh: reset } = useAsyncData(async () => {
    const mutatedState = _options.getInitialState();

    if (isEdit.value) {
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

  const { execute } = await useFetch(actionUrl, {
    method: computed(() => (isEdit.value ? 'put' : 'post')),
    body: state,
    lazy: true,
    server: false,
    immediate: false,
    watch: false,
  });

  async function onSubmit() {
    if (!isEdited.value) {
      $toast.add({
        title: 'Нечего сохранять',
        description: 'Отредактируй форму, чтобы выполнить сохранение',
        color: 'warning',
      });

      return;
    }

    try {
      await execute();

      $toast.add({
        title: 'Сохранено',
        description: 'Запись успешно сохранена!',
        color: 'success',
      });

      if (isEdit.value) {
        await reset();
      }
    } catch (error) {
      console.error(error);

      $toast.add({
        title: 'Ошибка сохранения',
        description: 'При попытке отправить форму произошла ошибка',
        color: 'error',
      });
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

    isEdited,
    isPreviewShowed,
    isPreviewLoading: computed(() => status.value === 'pending'),
    isPreviewError: computed(() => status.value === 'error'),

    onSubmit,
    onError,

    reset,
    showPreview,
  };
}
