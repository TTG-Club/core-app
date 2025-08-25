import type { FetchResponse } from 'ofetch';

export interface WorkshopFormOptions<T> {
  actionUrl: string;
  state: Ref<T>;
}

export function useWorkshopPreview<
  T extends Record<string, any>,
  R extends Record<string, any>,
>(options: WorkshopFormOptions<T>) {
  const $toast = useToast();
  const isPreviewShowed = useState<boolean>(() => false);

  const {
    data: preview,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<R>(`${options.actionUrl}/preview`, {
        method: 'post',
        body: toValue(options.state),
        onResponse,
      }),
    {
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  function onResponse({ response }: { response: FetchResponse<R> }) {
    if (!response.ok) {
      $toast.add({
        title: 'Ошибка предпросмотра',
        description: 'При попытке отправить форму произошла ошибка',
        color: 'error',
      });

      consola.error('[useWorkshopPreview] Error on response');

      return;
    }

    if (!response._data) {
      $toast.add({
        title: 'Ошибка ответа сервера',
        color: 'error',
      });

      consola.error('[useWorkshopPreview] Incorrect response from server');

      return;
    }

    isPreviewShowed.value = true;
  }

  async function showPreview() {
    clear();

    await loadPreview();
  }

  return {
    preview,

    isPreviewShowed,
    isPreviewLoading: computed(() => status.value === 'pending'),
    isPreviewError: computed(() => status.value === 'error'),

    showPreview,
  };
}
