import type { EffectScope, Ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, onScopeDispose, ref } from 'vue';

import { useAnalytics } from '~infrastructure/analytics/composables';
import { useCookieNotice } from '~infrastructure/cookie-consent/composables';

const cookies = new Map<string, Ref<unknown>>();
const removeScript = vi.fn();
const routerReady = vi.fn<() => Promise<void>>();

const scopes: Array<EffectScope> = [];
const metrika = vi.fn();
const useHeadMock = vi.fn();
const disableGoogle = vi.fn();
const enableGoogle = vi.fn();
const removeAfterEach = vi.fn();
const loadScript = vi.fn<() => Promise<unknown>>();
const reloadScript = vi.fn<() => Promise<unknown>>();
const scriptStatus = ref('awaitingLoad');

const runtimeConfig = {
  public: {
    gtag: { id: 'G-TEST', url: 'https://www.googletagmanager.com/gtag/js' },
    yandexMetrika: { id: '12345' },
  },
};

let navigate:
  | ((
      destination: { fullPath: string },
      origin: { fullPath: string },
      failure?: unknown,
    ) => void)
  | undefined;

/** Запускает подключение аналитики в области владельца. */
function mountAnalytics(): EffectScope {
  const scope = effectScope();

  scopes.push(scope);
  scope.run(useAnalytics);

  return scope;
}

beforeEach(() => {
  vi.useFakeTimers();
  cookies.clear();
  removeScript.mockReset();
  routerReady.mockReset().mockResolvedValue();
  metrika.mockReset();
  useHeadMock.mockReset();
  disableGoogle.mockReset();
  enableGoogle.mockReset();
  removeAfterEach.mockReset();
  loadScript.mockReset().mockResolvedValue({});
  reloadScript.mockReset().mockResolvedValue({});
  scriptStatus.value = 'awaitingLoad';
  runtimeConfig.public.gtag.id = 'G-TEST';
  runtimeConfig.public.yandexMetrika.id = '12345';
  navigate = undefined;
  vi.stubGlobal('computed', computed);

  vi.stubGlobal('useCookie', (name: string) => {
    const cookie = cookies.get(name) ?? ref<unknown>(null);

    cookies.set(name, cookie);

    return cookie;
  });

  vi.stubGlobal('onScopeDispose', onScopeDispose);
  vi.stubGlobal('window', { ym: metrika });
  vi.stubGlobal('consola', { warn: vi.fn() });

  vi.stubGlobal('useNuxtApp', () => ({
    runWithContext: (callback: () => void) => callback(),
  }));

  vi.stubGlobal('useRouter', () => ({
    isReady: routerReady,
    afterEach: (callback: typeof navigate) => {
      navigate = callback;

      return removeAfterEach;
    },
  }));

  vi.stubGlobal('useRuntimeConfig', () => runtimeConfig);

  vi.stubGlobal('useHead', useHeadMock);

  vi.stubGlobal('useGtag', () => ({
    disableAnalytics: disableGoogle,
    enableAnalytics: enableGoogle,
  }));

  vi.stubGlobal(
    'useScript',
    vi.fn(() => ({
      load: loadScript,
      reload: reloadScript,
      status: scriptStatus,
      remove: removeScript,
    })),
  );
});

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('автоматическое подключение внешней аналитики', () => {
  it.each([
    null,
    { version: '4', choice: 'necessary' },
    { version: '4', choice: 'all' },
  ])(
    'запускается до закрытия уведомления независимо от старого выбора %j',
    async (previousChoice) => {
      cookies.set('ttg-cookie-consent', ref(previousChoice));

      cookies.set(
        'ttg-cookie-dismissed',
        ref({ version: '4', until: Date.now() + 86400000 }),
      );

      const scope = mountAnalytics();
      const notice = scope.run(useCookieNotice);

      expect(notice?.isVisible.value).toBe(true);
      await vi.advanceTimersByTimeAsync(0);
      expect(loadScript).toHaveBeenCalledOnce();
      expect(enableGoogle).toHaveBeenCalledOnce();
      expect(metrika).toHaveBeenCalledWith('12345', 'init', expect.any(Object));

      expect(useHeadMock).toHaveBeenCalledWith({
        script: [
          {
            'src': 'https://www.googletagmanager.com/gtag/js?id=G-TEST',
            'defer': true,
            'data-gtag': '',
          },
        ],
      });

      notice?.dismiss();
      expect(notice?.isVisible.value).toBe(false);
      await vi.advanceTimersByTimeAsync(0);
      expect(loadScript).toHaveBeenCalledOnce();
      expect(useHeadMock).toHaveBeenCalledOnce();
      expect(disableGoogle).not.toHaveBeenCalled();
      expect(metrika).toHaveBeenCalledOnce();
    },
  );

  it('учитывает успешные переходы и останавливает счётчики при уничтожении владельца', async () => {
    const scope = mountAnalytics();

    await vi.advanceTimersByTimeAsync(0);
    navigate?.({ fullPath: '/cookies' }, { fullPath: '/privacy' });

    expect(metrika).toHaveBeenLastCalledWith('12345', 'hit', '/cookies', {
      referer: '/privacy',
    });

    navigate?.(
      { fullPath: '/failed' },
      { fullPath: '/cookies' },
      new Error('Отмена'),
    );

    expect(metrika).toHaveBeenCalledTimes(2);
    scope.stop();
    expect(metrika).toHaveBeenLastCalledWith('12345', 'destruct');
    expect(disableGoogle).toHaveBeenCalledOnce();
    expect(removeAfterEach).toHaveBeenCalledOnce();
    expect(removeScript).toHaveBeenCalledOnce();
    navigate?.({ fullPath: '/' }, { fullPath: '/cookies' });
    expect(metrika).toHaveBeenCalledTimes(3);
  });

  it('не учитывает переходы до готовности роутера и счётчика', async () => {
    const ready = Promise.withResolvers<void>();
    const script = Promise.withResolvers<unknown>();

    routerReady.mockReturnValue(ready.promise);
    loadScript.mockReturnValue(script.promise);
    mountAnalytics();
    navigate?.({ fullPath: '/cookies' }, { fullPath: '/' });
    expect(metrika).not.toHaveBeenCalled();
    script.resolve({});
    await vi.advanceTimersByTimeAsync(0);
    navigate?.({ fullPath: '/cookies' }, { fullPath: '/' });
    expect(metrika).toHaveBeenCalledOnce();
    ready.resolve();
    await vi.advanceTimersByTimeAsync(0);
    navigate?.({ fullPath: '/privacy' }, { fullPath: '/cookies' });

    expect(metrika).toHaveBeenLastCalledWith('12345', 'hit', '/privacy', {
      referer: '/cookies',
    });
  });

  it('игнорирует загрузку после уничтожения владельца', async () => {
    const script = Promise.withResolvers<unknown>();

    loadScript.mockReturnValue(script.promise);

    const scope = mountAnalytics();

    scope.stop();
    script.resolve({});
    await vi.advanceTimersByTimeAsync(0);
    expect(removeAfterEach).toHaveBeenCalledOnce();
    expect(disableGoogle).toHaveBeenCalledOnce();
    expect(metrika).not.toHaveBeenCalled();
  });

  it('ошибка Метрики не мешает GA; новый запуск приложения повторяет загрузку', async () => {
    loadScript.mockRejectedValue(new Error('Нет сети'));

    const scope = mountAnalytics();

    await vi.advanceTimersByTimeAsync(0);
    expect(metrika).not.toHaveBeenCalled();
    expect(enableGoogle).toHaveBeenCalledOnce();
    expect(consola.warn).toHaveBeenCalledOnce();
    scope.stop();
    scriptStatus.value = 'error';
    mountAnalytics();
    await vi.advanceTimersByTimeAsync(0);
    expect(reloadScript).toHaveBeenCalledOnce();
    expect(metrika).toHaveBeenCalledOnce();
  });

  it.each([
    { googleId: '', metrikaId: '', expectedGoogle: 0, expectedMetrika: 0 },
    {
      googleId: 'G-TEST',
      metrikaId: '',
      expectedGoogle: 1,
      expectedMetrika: 0,
    },
    { googleId: '', metrikaId: '12345', expectedGoogle: 0, expectedMetrika: 1 },
  ])(
    'подключает только настроенные сервисы: $googleId / $metrikaId',
    async ({ googleId, metrikaId, expectedGoogle, expectedMetrika }) => {
      runtimeConfig.public.gtag.id = googleId;
      runtimeConfig.public.yandexMetrika.id = metrikaId;
      mountAnalytics();
      await vi.advanceTimersByTimeAsync(0);
      expect(useScript).toHaveBeenCalledTimes(expectedMetrika);
      expect(useHeadMock).toHaveBeenCalledTimes(expectedGoogle);
      expect(metrika).toHaveBeenCalledTimes(expectedMetrika);
    },
  );
});
