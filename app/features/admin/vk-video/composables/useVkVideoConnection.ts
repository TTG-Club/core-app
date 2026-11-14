import type { VkVideoConnectionStatus } from '#shared/types';

import type { VkVideoLoginMessage } from '../model';

import {
  VK_VIDEO_ADMIN_API_PATH,
  VK_VIDEO_ADMIN_LOGIN_API_PATH,
  VK_VIDEO_CONNECT_RESULT,
} from '#shared/consts';
import {
  vkVideoConnectionStatusSchema,
  vkVideoLoginStartSchema,
} from '#shared/utils';

import {
  parseVkVideoLoginMessage,
  VK_VIDEO_ADMIN_DATA_KEY,
  VK_VIDEO_ADMIN_TEXT,
  VK_VIDEO_LOGIN_WINDOW_FEATURES,
  VK_VIDEO_LOGIN_WINDOW_NAME,
  VK_VIDEO_LOGIN_WINDOW_POLL_MS,
} from '../model';

/**
 * Ждёт итог входа из всплывающего окна: сообщение от страницы подключения
 * или закрытие окна вручную (тогда итог — `null`).
 *
 * @param popup окно входа
 * @returns итог входа или `null`, если окно закрыли
 */
function waitForLogin(popup: Window): Promise<VkVideoLoginMessage | null> {
  return new Promise((resolve) => {
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    /**
     * Снимает слежение за окном и отдаёт итог.
     *
     * @param message итог входа или `null`
     */
    function finish(message: VkVideoLoginMessage | null): void {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollTimer);
      resolve(message);
    }

    /**
     * Принимает итог только от своего сайта и только от окна входа.
     *
     * @param event событие `message`
     */
    function handleMessage(event: MessageEvent): void {
      if (event.origin !== window.location.origin) {
        return;
      }

      const message = parseVkVideoLoginMessage(event.data);

      if (message) {
        finish(message);
      }
    }

    window.addEventListener('message', handleMessage);

    pollTimer = setInterval(() => {
      if (popup.closed) {
        finish(null);
      }
    }, VK_VIDEO_LOGIN_WINDOW_POLL_MS);
  });
}

/**
 * Состояние подключения ВК текущего редактора с проверкой ответа.
 *
 * @returns состояние подключения
 */
async function fetchConnectionStatus(): Promise<VkVideoConnectionStatus> {
  return vkVideoConnectionStatusSchema.parse(
    await $fetch<unknown>(VK_VIDEO_ADMIN_API_PATH),
  );
}

/**
 * Подключение ВК текущего редактора (у каждого своё): состояние, вход через
 * VK ID во всплывающем окне — без ухода со страницы, чтобы не потерять
 * несохранённую запись, — и отключение.
 *
 * @returns состояние подключения и действия с ним
 */
export function useVkVideoConnection() {
  const $toast = useToast();

  // server: false — приватные данные грузим на клиенте, где авторизация
  // (cookie → Bearer) гарантированно работает.
  const {
    data: connection,
    error: loadError,
    status,
    refresh,
  } = useAsyncData(VK_VIDEO_ADMIN_DATA_KEY, fetchConnectionStatus, {
    server: false,
    lazy: true,
  });

  const isConnected = computed(() => !!connection.value?.connected);
  const isConnecting = ref(false);
  const isDisconnecting = ref(false);

  /**
   * Сообщает итог входа тостом.
   *
   * @param message итог из окна входа; `null` — окно закрыли без итога
   */
  function notifyLoginResult(message: VkVideoLoginMessage | null): void {
    if (!message) {
      return;
    }

    if (message.result === VK_VIDEO_CONNECT_RESULT.connected) {
      $toast.add({
        color: 'success',
        title: VK_VIDEO_ADMIN_TEXT.connectSuccess,
      });

      return;
    }

    $toast.add({
      color: 'error',
      title: VK_VIDEO_ADMIN_TEXT.connectError,
      description: message.reason ?? undefined,
    });
  }

  /**
   * Подключает ВК во всплывающем окне.
   *
   * @returns подключился ли ВК
   */
  async function connect(): Promise<boolean> {
    if (isConnecting.value) {
      return false;
    }

    // Окно открываем сразу по нажатию, до запроса: иначе браузер сочтёт его
    // непрошеным и заблокирует.
    const popup = window.open(
      '',
      VK_VIDEO_LOGIN_WINDOW_NAME,
      VK_VIDEO_LOGIN_WINDOW_FEATURES,
    );

    if (!popup) {
      $toast.add({ color: 'error', title: VK_VIDEO_ADMIN_TEXT.popupBlocked });

      return false;
    }

    isConnecting.value = true;

    try {
      const { authorizeUrl } = vkVideoLoginStartSchema.parse(
        await $fetch<unknown>(VK_VIDEO_ADMIN_LOGIN_API_PATH, {
          method: 'POST',
        }),
      );

      popup.location.href = authorizeUrl;

      const message = await waitForLogin(popup);

      await refresh();
      notifyLoginResult(message);

      return isConnected.value;
    } catch (connectError) {
      consola.error(connectError);
      popup.close();

      $toast.add({
        color: 'error',
        title: VK_VIDEO_ADMIN_TEXT.connectStartError,
      });

      return false;
    } finally {
      isConnecting.value = false;
    }
  }

  /** Отключает ВК редактора: ключ гасится и в самом ВК. */
  async function disconnect(): Promise<void> {
    if (isDisconnecting.value) {
      return;
    }

    isDisconnecting.value = true;

    try {
      connection.value = vkVideoConnectionStatusSchema.parse(
        await $fetch<unknown>(VK_VIDEO_ADMIN_API_PATH, { method: 'DELETE' }),
      );

      $toast.add({
        color: 'success',
        title: VK_VIDEO_ADMIN_TEXT.disconnectSuccess,
      });
    } catch (disconnectError) {
      consola.error(disconnectError);

      $toast.add({
        color: 'error',
        title: VK_VIDEO_ADMIN_TEXT.disconnectError,
      });
    } finally {
      isDisconnecting.value = false;
    }
  }

  return {
    connection,
    loadError,
    status,
    isConnected,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
    refresh,
  };
}
