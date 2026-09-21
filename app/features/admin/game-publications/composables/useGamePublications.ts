import type {
  PublicationChannel,
  PublicationChannelForm,
  PublicationSettingsForm,
} from '../model';

import { StatusCodes } from 'http-status-codes';

import { FetchStatus } from '~/shared/consts';

import {
  getPublicationFailureStatus,
  parsePublicationHistory,
  parsePublicationOverview,
  parsePublicationPreview,
  PUBLICATION_API,
  PUBLICATION_FETCH_KEYS,
  PUBLICATION_REQUEST_TIMEOUT,
  PUBLICATION_TEXT,
  publicationTestResultSchema,
} from '../model';

/** Загружает настройки и отменяет запросы при уходе из раздела. */
export function useGamePublications() {
  const { user, isAdmin } = useUser();

  const sessionIdentity = computed(
    () => user.value?.id ?? user.value?.username,
  );

  const initialIdentity = sessionIdentity.value;
  const accessRevoked = ref(false);
  const requestsEnabled = computed(() => isAdmin.value && !accessRevoked.value);

  const overviewRequest = useFetch(PUBLICATION_API, {
    key: PUBLICATION_FETCH_KEYS.settings,
    server: false,
    lazy: true,
    timeout: PUBLICATION_REQUEST_TIMEOUT,
    enabled: requestsEnabled,
    transform: parsePublicationOverview,
  });

  const previewRequest = useFetch(`${PUBLICATION_API}/preview`, {
    key: PUBLICATION_FETCH_KEYS.preview,
    server: false,
    lazy: true,
    timeout: PUBLICATION_REQUEST_TIMEOUT,
    enabled: requestsEnabled,
    transform: parsePublicationPreview,
  });

  const historyRequest = useFetch(`${PUBLICATION_API}/history`, {
    key: PUBLICATION_FETCH_KEYS.history,
    server: false,
    lazy: true,
    timeout: PUBLICATION_REQUEST_TIMEOUT,
    enabled: requestsEnabled,
    transform: parsePublicationHistory,
  });

  const busy = ref(false);
  const testingChannelId = ref<string | null>(null);
  const feedbackChannelId = ref<string | null>(null);
  const notice = ref('');
  const failure = ref('');
  const controller = new AbortController();

  let disposed = false;

  const loading = computed(() =>
    [
      overviewRequest.status.value,
      previewRequest.status.value,
      historyRequest.status.value,
    ].includes(FetchStatus.Pending),
  );

  const settingsLoading = computed(
    () => overviewRequest.status.value === FetchStatus.Pending,
  );

  /** Удаляет данные и останавливает ожидания после смены пользователя или отказа в доступе. */
  function revokeAccess(): void {
    // clear меняет ошибки запросов и повторно вызывает watch; флаг останавливает этот цикл.
    if (accessRevoked.value || disposed) {
      return;
    }

    accessRevoked.value = true;
    controller.abort();
    overviewRequest.clear();
    previewRequest.clear();
    historyRequest.clear();
    feedbackChannelId.value = null;
    notice.value = '';
    failure.value = PUBLICATION_TEXT.forbidden;
    busy.value = false;
    testingChannelId.value = null;
  }

  watch(
    [
      isAdmin,
      sessionIdentity,
      overviewRequest.error,
      previewRequest.error,
      historyRequest.error,
    ],
    () => {
      const denied = [
        overviewRequest.error.value,
        previewRequest.error.value,
        historyRequest.error.value,
      ].some((exception) => {
        const status = getPublicationFailureStatus(exception);

        return (
          status === StatusCodes.UNAUTHORIZED
          || status === StatusCodes.FORBIDDEN
        );
      });

      if (
        !isAdmin.value
        || sessionIdentity.value !== initialIdentity
        || denied
      ) {
        revokeAccess();
      }
    },
    // Проверяем только пять ссылок: поздний ответ не должен попасть в состояние даже в текущем такте.
    { flush: 'sync', immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
    controller.abort();
    overviewRequest.clear();
    previewRequest.clear();
    historyRequest.clear();
  });

  /** Сохраняет изменения без повторов сетевого запроса и без применения устаревшего ответа. */
  async function mutate(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: Record<string, unknown>,
    testedChannel?: PublicationChannel,
  ): Promise<boolean> {
    if (
      busy.value
      || settingsLoading.value
      || disposed
      || accessRevoked.value
    ) {
      return false;
    }

    busy.value = true;
    testingChannelId.value = testedChannel?.id ?? null;
    feedbackChannelId.value = testedChannel?.id ?? null;
    notice.value = '';
    failure.value = '';

    try {
      const response: unknown = await $fetch(`${PUBLICATION_API}${path}`, {
        method,
        body,
        signal: controller.signal,
        timeout: PUBLICATION_REQUEST_TIMEOUT,
        retry: 0,
      });

      if (disposed || accessRevoked.value) {
        return false;
      }

      let succeeded = true;

      if (testedChannel) {
        const result = publicationTestResultSchema.parse(response);

        succeeded = result.status === 'SENT';

        if (succeeded) {
          notice.value = `${testedChannel.name}: ${PUBLICATION_TEXT.testSent}`;
        } else {
          failure.value = `${testedChannel.name}: ${result.detail}`;
        }
      } else {
        overviewRequest.data.value = parsePublicationOverview(response);
        notice.value = PUBLICATION_TEXT.saved;
      }

      // Nuxt сохраняет ошибку чтения в historyRequest.error; она не отменяет успешное сохранение.
      void historyRequest.refresh();

      return succeeded && !disposed;
    } catch (exception: unknown) {
      if (disposed || accessRevoked.value) {
        return false;
      }

      const status = getPublicationFailureStatus(exception);

      if (status === StatusCodes.CONFLICT) {
        failure.value = PUBLICATION_TEXT.conflict;
      } else if (
        status === StatusCodes.UNAUTHORIZED
        || status === StatusCodes.FORBIDDEN
      ) {
        revokeAccess();
      } else if (testedChannel && status === StatusCodes.TOO_MANY_REQUESTS) {
        failure.value = PUBLICATION_TEXT.testLimited;
      } else if (testedChannel && status === StatusCodes.NOT_FOUND) {
        failure.value = PUBLICATION_TEXT.channelMissing;
      } else {
        failure.value = testedChannel
          ? PUBLICATION_TEXT.testUnknown
          : PUBLICATION_TEXT.saveError;
      }

      return false;
    } finally {
      if (!disposed) {
        busy.value = false;
        testingChannelId.value = null;
      }
    }
  }

  /** Сохраняет общее расписание вместе с его версией. */
  function saveSettings(settings: PublicationSettingsForm): Promise<boolean> {
    return mutate('/settings', 'PUT', settings);
  }

  /** Передаёт null для наследования и пустой адрес для сохранения прежнего. */
  function saveChannel(
    channelId: string | null,
    form: PublicationChannelForm,
  ): Promise<boolean> {
    return mutate(
      channelId ? `/channels/${channelId}` : '/channels',
      channelId ? 'PUT' : 'POST',
      {
        name: form.name,
        platform: form.platform,
        telegramChatId: form.platform === 'TELEGRAM' ? form.telegramChatId : '',
        vkGroupId: form.platform === 'VK' ? form.vkGroupId : '',
        enabled: form.enabled,
        webhookUrl: form.platform === 'DISCORD' ? form.webhookUrl : '',
        schedule: form.inherit ? null : form.schedule,
        revision: form.revision,
      },
    );
  }

  /** Удаляет только прочитанную версию канала. */
  function deleteChannel(channel: PublicationChannel): Promise<boolean> {
    return mutate(
      `/channels/${channel.id}?revision=${channel.revision}`,
      'DELETE',
    );
  }

  /** Проверяет уже сохранённый адрес канала без повторов при потере ответа. */
  function testChannel(channel: PublicationChannel): Promise<boolean> {
    return mutate(
      `/channels/${channel.id}/test?revision=${channel.revision}`,
      'POST',
      undefined,
      channel,
    );
  }

  /** Обновляет снимок после ошибки или изменений в другой вкладке. */
  async function refresh(): Promise<void> {
    if (busy.value || disposed || accessRevoked.value) {
      return;
    }

    notice.value = '';
    failure.value = '';
    feedbackChannelId.value = null;

    await Promise.all([
      overviewRequest.refresh(),
      previewRequest.refresh(),
      historyRequest.refresh(),
    ]);
  }

  const hasError = computed(
    () =>
      !!overviewRequest.error.value
      || !!previewRequest.error.value
      || !!historyRequest.error.value,
  );

  return {
    overview: overviewRequest.data,
    preview: previewRequest.data,
    history: historyRequest.data,
    busy,
    testingChannelId,
    feedbackChannelId,
    accessRevoked,
    notice,
    failure,
    loading,
    settingsLoading,
    hasError,
    saveSettings,
    saveChannel,
    deleteChannel,
    testChannel,
    refresh,
  };
}
