import type { FormErrorEvent } from '#ui/types';
import { cloneDeep, isEqual, merge } from 'lodash-es';

interface WorkshopBaseFormOptions<T> {
  actionUrl: MaybeRefOrGetter<string>;
  getInitialState: () => T;
}

interface WorkshopEditFormOptions<T> extends WorkshopBaseFormOptions<T> {
  type: MaybeRefOrGetter<'edit'>;
  entryUrl: MaybeRefOrGetter<string>;
  rawUrl: MaybeRefOrGetter<string>;
}

interface WorkshopCreateFormOptions<T> extends WorkshopBaseFormOptions<T> {
  type: MaybeRefOrGetter<'create'>;
}

type WorkshopFormOptions<T> = MaybeRefOrGetter<
  WorkshopEditFormOptions<T> | WorkshopCreateFormOptions<T>
>;

export function useWorkshopForm<T extends Record<string, any>>(
  options: WorkshopFormOptions<T>,
) {
  const _options = toValue(options);
  const $toast = useToast();

  const state = useState<T>(_options.getInitialState);
  const prevState = useState<T>(_options.getInitialState);

  const { status, refresh: reset } = useAsyncData<T>(
    computed(
      () =>
        `workshop-${_options.type}${_options.type === 'edit' && _options.entryUrl ? `-${_options.entryUrl}` : ''}`,
    ),
    async () => {
      const mutatedState = _options.getInitialState();

      if (_options.type === 'edit') {
        try {
          const resp = await $fetch<T>(_options.rawUrl);

          merge(mutatedState, resp);
        } catch (error) {
          consola.error(error);

          $toast.add({
            title: 'Ошибка данных',
            description: 'При попытке отобразить форму произошла ошибка',
            color: 'error',
            actions: [
              {
                label: 'i-ttg-center-axis',
                icon: 'refresh',
                onClick: withModifiers(reset, ['left', 'exact', 'prevent']),
              },
            ],
          });
        }
      }

      return mutatedState;
    },
  );

  const rawIncorrect = computed(() => status.value === 'error');

  const isEdited = computed(
    () => !isEqual(toRaw(prevState.value), toRaw(state.value)),
  );

  async function onSubmit(body: T) {
    if (!isEdited.value) {
      $toast.add({
        title: 'Нечего сохранять',
        description: 'Отредактируй форму, чтобы выполнить сохранение',
        color: 'warning',
      });
    }

    try {
      await $fetch(_options.actionUrl, {
        method: _options.type === 'edit' ? 'put' : 'post',
        body,
      });
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

  watch(() => options);

  return {
    state,

    isEdited,
    rawIncorrect,

    onSubmit,
    onError,

    reset,
  };
}
