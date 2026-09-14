import type { EffectScope } from 'vue';

import { useIntervalFn } from '@vueuse/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computed,
  effectScope,
  nextTick,
  onScopeDispose,
  ref,
  watch,
} from 'vue';

import { useOnlineHeartbeat } from '~infrastructure/analytics/composables';

const consent = vi.hoisted(() => ({ allowed: { value: false } }));

vi.mock('~infrastructure/cookie-consent/composables', () => ({
  useCookieConsent: () => ({ isAnalyticsAllowed: consent.allowed }),
}));

const scopes: Array<EffectScope> = [];
const visitor = ref<unknown>(null);
const user = ref<{ username: string } | null>(null);
const counter = ref<number | null>(null);
const visibility = ref('visible');
const fetchProfile = vi.fn<() => Promise<void>>();
const heartbeat = vi.fn<(...parameters: Array<unknown>) => Promise<unknown>>();

let mountHook: (() => void) | undefined;

const removeMountHook = vi.fn();

/** Создаёт настоящий композабл и вызывает зарегистрированный хук приложения. */
function mountHeartbeat(): EffectScope {
  const scope = effectScope();

  scopes.push(scope);
  scope.run(useOnlineHeartbeat);
  mountHook?.();

  return scope;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse('2026-09-13T12:00:00Z'));
  consent.allowed = ref(false);
  visitor.value = null;
  user.value = null;
  counter.value = null;
  visibility.value = 'visible';
  mountHook = undefined;
  removeMountHook.mockReset();
  fetchProfile.mockReset().mockResolvedValue();
  heartbeat.mockReset().mockResolvedValue({ total: 12 });
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('onScopeDispose', onScopeDispose);
  vi.stubGlobal('useIntervalFn', useIntervalFn);
  vi.stubGlobal('useCookie', () => visitor);
  vi.stubGlobal('useState', () => counter);
  vi.stubGlobal('useDocumentVisibility', () => visibility);

  vi.stubGlobal('useUser', () => ({
    fetch: fetchProfile,
    user,
    isLoggedIn: computed(() => !!user.value),
  }));

  vi.stubGlobal('useNuxtApp', () => ({
    hooks: {
      hook: (_name: string, callback: () => void) => {
        mountHook = callback;

        return removeMountHook;
      },
    },
  }));

  vi.stubGlobal('$fetch', heartbeat);
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('consola', { warn: vi.fn() });
});

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('согласие и учёт посетителей онлайн', () => {
  it.each([{ cookie: '' }, { cookie: { unexpected: true } }, { cookie: [] }])(
    'заменяет повреждённый идентификатор $cookie только после согласия',
    async ({ cookie: invalidCookie }) => {
      visitor.value = invalidCookie;
      mountHeartbeat();
      expect(visitor.value).toEqual(invalidCookie);
      consent.allowed.value = true;
      await vi.advanceTimersByTimeAsync(0);
      expect(visitor.value).toEqual(expect.any(String));
      expect(visitor.value).not.toEqual(invalidCookie);

      expect(heartbeat).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: { key: visitor.value, type: 'GUEST' },
        }),
      );
    },
  );

  it('до согласия не создаёт идентификатор, таймер и запросы', async () => {
    mountHeartbeat();
    visibility.value = 'hidden';
    await nextTick();
    visibility.value = 'visible';
    await vi.advanceTimersByTimeAsync(60_000);
    expect(visitor.value).toBeNull();
    expect(heartbeat).not.toHaveBeenCalled();
    expect(fetchProfile).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('после согласия учитывает гостя, затем останавливается и запускается повторно', async () => {
    mountHeartbeat();
    consent.allowed.value = true;
    await vi.advanceTimersByTimeAsync(0);

    expect(heartbeat).toHaveBeenCalledWith(
      '/api/v2/online/heartbeat',
      expect.objectContaining({
        body: { key: visitor.value, type: 'GUEST' },
        signal: expect.any(AbortSignal),
      }),
    );

    expect(counter.value).toBe(12);

    const guestKey = visitor.value;

    consent.allowed.value = false;
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    consent.allowed.value = true;
    await vi.advanceTimersByTimeAsync(0);
    expect(heartbeat).toHaveBeenCalledTimes(2);
    expect(visitor.value).toBe(guestKey);
  });

  it('не отправляет статистику после отзыва во время загрузки профиля', async () => {
    const profile = Promise.withResolvers<void>();

    fetchProfile.mockReturnValue(profile.promise);
    consent.allowed.value = true;
    mountHeartbeat();
    consent.allowed.value = false;
    profile.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(heartbeat).not.toHaveBeenCalled();
    expect(visitor.value).toBeNull();
  });

  it('отменяет отправленный запрос и игнорирует его запоздалый ответ', async () => {
    const response = Promise.withResolvers<unknown>();

    heartbeat.mockReturnValue(response.promise);
    consent.allowed.value = true;
    mountHeartbeat();
    await vi.advanceTimersByTimeAsync(0);

    const requestOptions = heartbeat.mock.calls[0]?.[1];

    if (
      !requestOptions
      || typeof requestOptions !== 'object'
      || !('signal' in requestOptions)
      || !(requestOptions.signal instanceof AbortSignal)
    ) {
      throw new Error('Запрос не получил AbortSignal');
    }

    consent.allowed.value = false;
    expect(requestOptions.signal.aborted).toBe(true);
    response.resolve({ total: 999 });
    await vi.advanceTimersByTimeAsync(0);
    expect(counter.value).toBeNull();
  });

  it('не применяет результат прежнего пользователя после выхода', async () => {
    const response = Promise.withResolvers<unknown>();

    heartbeat.mockReturnValueOnce(response.promise);
    user.value = { username: 'tester' };
    visitor.value = '01994481-4800-7000-8000-000000000001';
    consent.allowed.value = true;
    mountHeartbeat();

    expect(heartbeat).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: {
          key: 'tester',
          previousGuestKey: visitor.value,
          type: 'REGISTERED',
        },
      }),
    );

    user.value = null;
    response.resolve({ total: 999 });
    await vi.advanceTimersByTimeAsync(0);
    expect(counter.value).toBeNull();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(counter.value).toBe(12);
  });

  it('без Web Locks пропускает скрытую вкладку и соблюдает интервал после возврата', async () => {
    visibility.value = 'hidden';
    consent.allowed.value = true;
    mountHeartbeat();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(heartbeat).not.toHaveBeenCalled();
    visibility.value = 'visible';
    await vi.advanceTimersByTimeAsync(0);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    visibility.value = 'hidden';
    await nextTick();
    visibility.value = 'visible';
    await vi.advanceTimersByTimeAsync(0);
    expect(heartbeat).toHaveBeenCalledTimes(1);
  });

  it('вкладка в очереди Web Locks не отправляет запрос при возвращении и отменяет ожидание', async () => {
    let waitingSignal: AbortSignal | undefined;
    let acquire: (() => Promise<void>) | undefined;

    vi.stubGlobal('navigator', {
      locks: {
        request: vi.fn(
          (
            _name: string,
            options: { signal: AbortSignal },
            callback: () => Promise<void>,
          ) => {
            waitingSignal = options.signal;
            acquire = callback;

            return Promise.resolve();
          },
        ),
      },
    });

    consent.allowed.value = true;

    const scope = mountHeartbeat();

    visibility.value = 'hidden';
    await nextTick();
    visibility.value = 'visible';
    await vi.advanceTimersByTimeAsync(0);
    expect(heartbeat).not.toHaveBeenCalled();
    scope.stop();
    expect(waitingSignal?.aborted).toBe(true);
    await acquire?.();
    expect(vi.getTimerCount()).toBe(0);
    expect(heartbeat).not.toHaveBeenCalled();
    expect(removeMountHook).toHaveBeenCalledOnce();
  });

  it('освобождает захваченную блокировку при отзыве согласия', async () => {
    let released: Promise<void> | undefined;

    vi.stubGlobal('navigator', {
      locks: {
        request: vi.fn(
          (_name: string, _options: unknown, callback: () => Promise<void>) => {
            released = callback();

            return released;
          },
        ),
      },
    });

    consent.allowed.value = true;
    mountHeartbeat();
    await vi.advanceTimersByTimeAsync(0);
    expect(heartbeat).toHaveBeenCalledOnce();
    consent.allowed.value = false;
    await released;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('после ошибки запроса продолжает обновления, не запуская параллельные запросы', async () => {
    const response = Promise.withResolvers<unknown>();

    heartbeat.mockReturnValueOnce(response.promise);
    consent.allowed.value = true;

    const scope = mountHeartbeat();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(heartbeat).toHaveBeenCalledOnce();
    response.reject(new Error('Нет сети'));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(heartbeat).toHaveBeenCalledTimes(2);
    expect(counter.value).toBe(12);
    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
