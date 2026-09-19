import type { EffectScope, Ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, ref } from 'vue';

import { useCookieNotice } from '~infrastructure/cookie-consent/composables';

const NOTICE_KEY = 'ttg-cookie-notice';
const cookies = new Map<string, Ref<unknown>>();
const scopes: Array<EffectScope> = [];

/** Подменяет только хранилище Nuxt; реактивность остаётся настоящей. */
function useTestCookie(name: string): Ref<unknown> {
  const existingCookie = cookies.get(name);

  if (existingCookie) {
    return existingCookie;
  }

  const cookie = ref<unknown>(null);

  cookies.set(name, cookie);

  return cookie;
}

/** Запускает уведомление в области владельца для проверки повторного открытия. */
function mountNotice(): {
  state: ReturnType<typeof useCookieNotice>;
  scope: EffectScope;
} {
  const scope = effectScope();

  scopes.push(scope);

  const state = scope.run(useCookieNotice);

  if (!state) {
    throw new Error('Не удалось создать состояние уведомления');
  }

  return { state, scope };
}

beforeEach(() => {
  cookies.clear();
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('useCookie', vi.fn(useTestCookie));
});

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop());
  vi.unstubAllGlobals();
});

describe('информационное уведомление о cookie', () => {
  it('показывается при первом посещении без записи о согласии', () => {
    const { state } = mountNotice();

    expect(state.isVisible.value).toBe(true);
    expect(cookies.get(NOTICE_KEY)?.value).toBeNull();
    expect(cookies.has('ttg-cookie-consent')).toBe(false);
  });

  it('закрывается на год и остаётся скрытым при повторном открытии', () => {
    const firstVisit = mountNotice();

    firstVisit.state.dismiss();
    expect(firstVisit.state.isVisible.value).toBe(false);
    expect(cookies.get(NOTICE_KEY)?.value).toEqual({ version: '1' });

    expect(useCookie).toHaveBeenCalledWith(
      NOTICE_KEY,
      expect.objectContaining({
        maxAge: 365 * 86400,
        path: '/',
        sameSite: 'lax',
      }),
    );

    firstVisit.scope.stop();
    expect(mountNotice().state.isVisible.value).toBe(false);
  });

  it.each([null, '', '1', {}, { version: 'old' }, { version: 1 }])(
    'не скрывается при старой или повреждённой записи: %j',
    (cookieValue) => {
      useTestCookie(NOTICE_KEY).value = cookieValue;
      expect(mountNotice().state.isVisible.value).toBe(true);
    },
  );

  it.each(['all', 'necessary'])(
    'показывает новый текст при старом выборе %s',
    (choice) => {
      useTestCookie('ttg-cookie-consent').value = { version: '4', choice };

      useTestCookie('ttg-cookie-dismissed').value = {
        version: '4',
        until: Date.now() + 86400000,
      };

      expect(mountNotice().state.isVisible.value).toBe(true);
    },
  );

  it('обновляет открытых потребителей после закрытия и очистки cookie', () => {
    const firstNotice = mountNotice();
    const secondNotice = mountNotice();

    firstNotice.state.dismiss();
    expect(secondNotice.state.isVisible.value).toBe(false);
    useTestCookie(NOTICE_KEY).value = null;
    expect(firstNotice.state.isVisible.value).toBe(true);
    expect(secondNotice.state.isVisible.value).toBe(true);
  });
});
