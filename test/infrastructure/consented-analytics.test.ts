import type { EffectScope } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, onScopeDispose, ref, watch } from 'vue';

import { useConsentedAnalytics } from '~infrastructure/analytics/composables';

const consent = vi.hoisted(() => ({ allowed: { value: false } }));

vi.mock('~infrastructure/cookie-consent/composables', () => ({
  useCookieConsent: () => ({ isAnalyticsAllowed: consent.allowed }),
}));

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
  scope.run(useConsentedAnalytics);

  return scope;
}

beforeEach(() => {
  vi.useFakeTimers();
  consent.allowed = ref(false);
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
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('onScopeDispose', onScopeDispose);
  vi.stubGlobal('window', { ym: metrika });
  vi.stubGlobal('consola', { warn: vi.fn() });

  vi.stubGlobal('useNuxtApp', () => ({
    runWithContext: (callback: () => void) => callback(),
  }));

  vi.stubGlobal('useRouter', () => ({
    isReady: () => Promise.resolve(),
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
      remove: vi.fn(),
    })),
  );
});

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('подключение внешней аналитики', () => {
  it('до согласия оставляет скрипт в ручном режиме и не запускает счётчики', async () => {
    mountAnalytics();
    await vi.advanceTimersByTimeAsync(0);

    expect(useScript).toHaveBeenCalledWith(expect.any(Object), {
      trigger: 'manual',
    });

    expect(loadScript).not.toHaveBeenCalled();
    expect(useHeadMock).not.toHaveBeenCalled();
    expect(disableGoogle).toHaveBeenCalledOnce();
    expect(metrika).not.toHaveBeenCalled();
  });

  it('запускает после согласия, учитывает только успешные переходы и останавливает после отзыва', async () => {
    mountAnalytics();
    consent.allowed.value = true;
    await vi.advanceTimersByTimeAsync(0);

    expect(useHeadMock).toHaveBeenCalledWith({
      script: [
        {
          'src': 'https://www.googletagmanager.com/gtag/js?id=G-TEST',
          'defer': true,
          'data-gtag': '',
        },
      ],
    });

    expect(enableGoogle).toHaveBeenCalledOnce();
    expect(metrika).toHaveBeenCalledWith('12345', 'init', expect.any(Object));
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
    consent.allowed.value = false;
    expect(metrika).toHaveBeenLastCalledWith('12345', 'destruct');
    expect(disableGoogle).toHaveBeenCalledTimes(2);
    navigate?.({ fullPath: '/' }, { fullPath: '/cookies' });
    expect(metrika).toHaveBeenCalledTimes(3);
    consent.allowed.value = true;
    await vi.advanceTimersByTimeAsync(0);

    expect(metrika).toHaveBeenLastCalledWith(
      '12345',
      'init',
      expect.any(Object),
    );

    // Повторное согласие не вставляет второй скрипт Google Analytics.
    expect(useHeadMock).toHaveBeenCalledOnce();
  });

  it('не запускает Метрику, если согласие отозвано во время загрузки', async () => {
    const script = Promise.withResolvers<unknown>();

    loadScript.mockReturnValue(script.promise);
    mountAnalytics();
    consent.allowed.value = true;
    consent.allowed.value = false;
    script.resolve({});
    await vi.advanceTimersByTimeAsync(0);
    expect(metrika).not.toHaveBeenCalled();
  });

  it('после быстрого повторного согласия запускает только актуальное ожидание', async () => {
    const script = Promise.withResolvers<unknown>();

    loadScript.mockReturnValue(script.promise);
    mountAnalytics();
    consent.allowed.value = true;
    consent.allowed.value = false;
    consent.allowed.value = true;
    script.resolve({});
    await vi.advanceTimersByTimeAsync(0);
    expect(metrika).toHaveBeenCalledOnce();
  });

  it('снимает обработчик маршрута и игнорирует загрузку после уничтожения владельца', async () => {
    const script = Promise.withResolvers<unknown>();

    loadScript.mockReturnValue(script.promise);
    consent.allowed.value = true;

    const scope = mountAnalytics();

    scope.stop();
    script.resolve({});
    await vi.advanceTimersByTimeAsync(0);
    expect(removeAfterEach).toHaveBeenCalledOnce();
    expect(disableGoogle).toHaveBeenCalledOnce();
    expect(metrika).not.toHaveBeenCalled();
  });

  it('после ошибки загрузки повторяет её при новом согласии', async () => {
    loadScript.mockRejectedValue(new Error('Нет сети'));
    mountAnalytics();
    consent.allowed.value = true;
    await vi.advanceTimersByTimeAsync(0);
    expect(metrika).not.toHaveBeenCalled();
    scriptStatus.value = 'error';
    consent.allowed.value = false;
    consent.allowed.value = true;
    await vi.advanceTimersByTimeAsync(0);
    expect(reloadScript).toHaveBeenCalledOnce();
    expect(metrika).toHaveBeenCalledOnce();
  });

  it('без идентификаторов не подключает сервисы даже при согласии', async () => {
    runtimeConfig.public.gtag.id = '';
    runtimeConfig.public.yandexMetrika.id = '';
    consent.allowed.value = true;
    mountAnalytics();
    await vi.advanceTimersByTimeAsync(0);
    expect(useScript).not.toHaveBeenCalled();
    expect(useHeadMock).not.toHaveBeenCalled();
    expect(metrika).not.toHaveBeenCalled();
  });
});
