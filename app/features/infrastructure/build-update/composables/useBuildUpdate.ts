import {
  BUILD_UPDATE_CHECK_THROTTLE_MS,
  LATEST_BUILD_MANIFEST_PATH,
  parseLatestBuildId,
} from '../model';

/**
 * Подхватывает новую выкладку сайта без Ctrl+Shift+R.
 *
 * Nuxt сам раз в `checkOutdatedBuildInterval` сверяет `builds/latest.json`
 * и при новой сборке перезагружает страницу на ближайшем переходе. Composable
 * добавляет то, чего там нет:
 * - сверку при возврате во вкладку и при восстановлении страницы из
 *   bfcache — таймер в фоновой вкладке браузер замораживает;
 * - немедленную перезагрузку, если чанк не загрузился вне перехода
 *   (ленивый компонент, дровер, модалка) и сервер подтвердил новую сборку.
 *   Без этого часть интерфейса молча не открывалась. Сетевой сбой при
 *   старой сборке к перезагрузке не приводит.
 *
 * Побочный эффект: сам вызывает хук `app:manifest:update` и перезагружает
 * страницу через `reloadNuxtApp`.
 */
export function useBuildUpdate(): void {
  const nuxtApp = useNuxtApp();
  const { app } = useRuntimeConfig();
  const router = useRouter();
  const visibility = useDocumentVisibility();

  let isNavigating = false;
  let isOutdated = false;

  router.beforeEach(() => {
    isNavigating = true;
  });

  router.afterEach(() => {
    isNavigating = false;
  });

  router.onError(() => {
    isNavigating = false;
  });

  nuxtApp.hook('app:manifest:update', () => {
    isOutdated = true;
  });

  /** Запрашивает номер последней сборки; при сетевой ошибке возвращает `undefined`. */
  async function fetchLatestBuildId(): Promise<string | undefined> {
    try {
      const latestBuildResponse = await $fetch<unknown>(
        `${app.buildAssetsDir}${LATEST_BUILD_MANIFEST_PATH}`,
        { baseURL: app.cdnURL || app.baseURL, cache: 'no-store' },
      );

      return parseLatestBuildId(latestBuildResponse);
    } catch {
      return undefined;
    }
  }

  /** Сверяет сборку с сервером и сообщает Nuxt о новой, если она вышла. */
  async function detectNewBuild(): Promise<boolean> {
    if (isOutdated) {
      return true;
    }

    const latestBuildId = await fetchLatestBuildId();

    if (!latestBuildId || latestBuildId === app.buildId) {
      return false;
    }

    await nuxtApp.callHook('app:manifest:update', {
      id: latestBuildId,
      timestamp: Date.now(),
    });

    return true;
  }

  const checkForNewBuildThrottled = useThrottleFn(
    detectNewBuild,
    BUILD_UPDATE_CHECK_THROTTLE_MS,
  );

  /** Перезагружает страницу, если чанк не загрузился из-за новой сборки. */
  async function handleChunkError(): Promise<void> {
    // Ошибку чанка во время перехода Nuxt обрабатывает сам.
    if (isNavigating) {
      return;
    }

    if (await detectNewBuild()) {
      reloadNuxtApp({ persistState: true });
    }
  }

  /** Сверяет сборку, когда страницу вернули из bfcache. */
  function handlePageShow(pageShowEvent: PageTransitionEvent): void {
    if (pageShowEvent.persisted) {
      checkForNewBuildThrottled();
    }
  }

  nuxtApp.hook('app:chunkError', handleChunkError);

  onNuxtReady(() => {
    whenever(() => visibility.value === 'visible', checkForNewBuildThrottled);
    useEventListener(window, 'pageshow', handlePageShow);
  });
}
