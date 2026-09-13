import type { EffectScope, Ref } from 'vue';

import { useTimeoutFn } from '@vueuse/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, nextTick, ref, watch } from 'vue';

import { useCookieConsent } from '~infrastructure/cookie-consent/composables';

const CONSENT_KEY = 'ttg-cookie-consent';
const DISMISSAL_KEY = 'ttg-cookie-dismissed';
const DAY = 24 * 60 * 60 * 1000;
const INITIAL_TIME = Date.parse('2026-09-13T12:00:00Z');

const cookies = new Map<string, Ref<unknown>>();
const scopes: Array<EffectScope> = [];

/** Подменяет только хранилище Nuxt; реактивность и таймеры VueUse остаются настоящими. */
function useTestCookie(name: string): Ref<unknown> {
  const existingCookie = cookies.get(name);

  if (existingCookie) {
    return existingCookie;
  }

  const cookie = ref<unknown>(null);

  cookies.set(name, cookie);

  return cookie;
}

/** Запускает композабл в области владельца для проверки повторного открытия и очистки. */
function mountConsent(): {
  state: ReturnType<typeof useCookieConsent>;
  scope: EffectScope;
} {
  const scope = effectScope();

  scopes.push(scope);

  const state = scope.run(useCookieConsent);

  if (!state) {
    throw new Error('Не удалось создать состояние уведомления');
  }

  return { state, scope };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(INITIAL_TIME);
  cookies.clear();
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('useTimeoutFn', useTimeoutFn);
  vi.stubGlobal('useCookie', vi.fn(useTestCookie));
});

afterEach(() => {
  for (const scope of scopes.splice(0)) {
    scope.stop();
  }

  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('выбор cookie и повторный показ уведомления', () => {
  it('до выбора показывает баннер и не разрешает аналитику', () => {
    const { state } = mountConsent();

    expect(state.isVisible.value).toBe(true);
    expect(state.isAnalyticsAllowed.value).toBe(false);
    expect(cookies.get(CONSENT_KEY)?.value).toBeNull();
  });

  it('после крестика напоминает ровно через сутки без включения аналитики', async () => {
    const { state } = mountConsent();

    state.acceptNecessary();
    await nextTick();

    expect(state.isVisible.value).toBe(false);
    expect(state.isAnalyticsAllowed.value).toBe(false);

    expect(useCookie).toHaveBeenCalledWith(
      DISMISSAL_KEY,
      expect.objectContaining({ maxAge: 86400 }),
    );

    await vi.advanceTimersByTimeAsync(DAY - 1);
    expect(state.isVisible.value).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.isVisible.value).toBe(true);
    expect(state.isAnalyticsAllowed.value).toBe(false);
  });

  it('повторное открытие не продлевает сутки от первого закрытия', async () => {
    const firstVisit = mountConsent();

    firstVisit.state.acceptNecessary();
    await nextTick();
    await vi.advanceTimersByTimeAsync(DAY / 2);
    firstVisit.scope.stop();

    const nextVisit = mountConsent();

    expect(nextVisit.state.isVisible.value).toBe(false);
    await vi.advanceTimersByTimeAsync(DAY / 2);
    expect(nextVisit.state.isVisible.value).toBe(true);
    expect(nextVisit.state.isAnalyticsAllowed.value).toBe(false);
  });

  it('принятие отменяет напоминание и сохраняет согласие на год', async () => {
    const { state } = mountConsent();

    state.acceptNecessary();
    await nextTick();
    state.acceptAll();
    await nextTick();

    expect(useCookie).toHaveBeenCalledWith(
      CONSENT_KEY,
      expect.objectContaining({ maxAge: 365 * 86400 }),
    );

    expect(state.isAnalyticsAllowed.value).toBe(true);
    expect(cookies.get(DISMISSAL_KEY)?.value).toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(DAY);
    expect(state.isVisible.value).toBe(false);
    expect(mountConsent().state.isAnalyticsAllowed.value).toBe(true);
  });

  it.each([
    { version: '3', until: INITIAL_TIME + DAY },
    { version: '4', until: 'tomorrow' },
    { version: '4', until: INITIAL_TIME },
    { version: '4', until: INITIAL_TIME + DAY + 1 },
  ])(
    'старая, повреждённая или просроченная запись не скрывает баннер: %j',
    (cookieValue) => {
      useTestCookie(DISMISSAL_KEY).value = cookieValue;

      const { state } = mountConsent();

      expect(state.isVisible.value).toBe(true);
      expect(state.isAnalyticsAllowed.value).toBe(false);
    },
  );

  it('синхронизирует согласие и отменяет таймеры у открытых потребителей', async () => {
    const firstTab = mountConsent();
    const secondTab = mountConsent();

    firstTab.state.acceptNecessary();
    await nextTick();
    expect(secondTab.state.isVisible.value).toBe(false);

    secondTab.state.acceptAll();
    await nextTick();
    expect(firstTab.state.isAnalyticsAllowed.value).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('освобождает таймер при уничтожении владельца', async () => {
    const { state, scope } = mountConsent();

    state.acceptNecessary();
    await nextTick();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
