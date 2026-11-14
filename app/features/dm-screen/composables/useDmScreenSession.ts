import { USER_TOKEN_COOKIE } from '#shared/consts';

import { fetchScreen, saveScreen } from '../model';
import { useDmScreen } from './useDmScreen';

/** Откуда страница ширмы берёт окна и на каком она шаге. */
type ScreenSessionStatus = 'loading' | 'failed' | 'account' | 'local';

/**
 * Жизнь ширмы на её странице. Гостю отдаёт ширму из браузера, вошедшему —
 * подключает ширму из аккаунта и следит, чтобы изменения не потерялись при
 * уходе со страницы. Первый вход забирает в аккаунт окна, собранные в
 * браузере до него. Если аккаунт недоступен, страница может остаться на
 * ширме браузера (`switchToLocal`).
 *
 * Побочные действия: запросы к серверу при монтировании, входе и уходе со
 * страницы; перенос окон из localStorage в аккаунт.
 */
export function useDmScreenSession() {
  const { windows, connect, disconnect, flush, clearLocal } = useDmScreen();

  const token = useCookie<string | null>(USER_TOKEN_COOKIE);

  const isAuthorized = computed(() => Boolean(token.value));

  const status = ref<ScreenSessionStatus>(
    isAuthorized.value ? 'loading' : 'local',
  );

  /** Загружает ширму аккаунта; пустой аккаунт получает окна из браузера. */
  async function load(): Promise<void> {
    status.value = 'loading';

    try {
      const remote = await fetchScreen();
      const local = [...windows.value];

      if (!remote.windows.length && local.length) {
        await saveScreen(local);

        connect(local);
        clearLocal();
      } else {
        connect(remote.windows);
      }

      status.value = 'account';
    } catch {
      status.value = 'failed';
    }
  }

  /** Оставляет страницу на ширме этого браузера. */
  function switchToLocal(): void {
    status.value = 'local';
  }

  /** Возвращает страницу к ширме браузера: пользователь вышел. */
  function leaveAccount(): void {
    disconnect();
    status.value = 'local';
  }

  // Вход и выход на самой странице ширмы: модалка входа её не перезагружает
  watch(isAuthorized, (authorized) => {
    if (authorized) {
      void load();
    } else {
      leaveAccount();
    }
  });

  onMounted(() => {
    if (isAuthorized.value) {
      void load();
    }
  });

  onBeforeUnmount(disconnect);

  const visibility = useDocumentVisibility();

  // Вкладку спрятали или закрыли: сохранить, пока браузер не оборвал запрос
  watch(visibility, (visibilityState) => {
    if (visibilityState === 'hidden') {
      void flush({ isLeaving: true });
    }
  });

  useEventListener('pagehide', () => {
    void flush({ isLeaving: true });
  });

  return {
    status: readonly(status),
    isAuthorized,
    load,
    switchToLocal,
  };
}
