import type { EffectScope } from 'vue';

import { createSharedComposable } from '@vueuse/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, shallowRef, toValue, watch } from 'vue';

// Композабл создаётся при импорте модуля: обёртка нужна раньше, чем он загрузится.
vi.stubGlobal('createSharedComposable', createSharedComposable);

const { useUserPublicProfiles } =
  await import('~/composables/useUserPublicProfiles');

const fetchProfiles =
  vi.fn<
    (
      path: string,
      options: { body: { userIds: Array<string> } },
    ) => Promise<unknown>
  >();

const scopes: Array<EffectScope> = [];

/** Профиль из ответа core-api для идентификатора. */
function createProfileResponse(userId: string) {
  return {
    userId,
    displayName: `Имя ${userId}`,
    avatarUrl: `/s3/avatars/${userId}/1-avatar.webp`,
  };
}

/** Отвечает на запрос профилями всех запрошенных идентификаторов. */
function answerAllRequested(
  _path: string,
  options: { body: { userIds: Array<string> } },
): Promise<unknown> {
  return Promise.resolve(options.body.userIds.map(createProfileResponse));
}

/** Создаёт общий композабл в отдельной области, как это делает компонент. */
function mountProfiles() {
  const scope = effectScope();

  scopes.push(scope);

  const profiles = scope.run(useUserPublicProfiles);

  if (!profiles) {
    throw new Error('composable did not start');
  }

  return profiles;
}

/** Дожидается отправки пачки и разбора ответа. */
async function flushRequests(): Promise<void> {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.stubGlobal('shallowRef', shallowRef);
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('toValue', toValue);
  vi.stubGlobal('nextTick', nextTick);
  vi.stubGlobal('$fetch', fetchProfiles);
  fetchProfiles.mockImplementation(answerAllRequested);
});

afterEach(() => {
  for (const scope of scopes.splice(0)) {
    scope.stop();
  }

  fetchProfiles.mockReset();
  vi.unstubAllGlobals();
});

describe('общий кеш имён и аватарок пользователей', () => {
  // Общий экземпляр на странице даёт createSharedComposable (в node-окружении
  // теста он, как и на сервере, не делится); здесь проверяется сама пачка:
  // карточки ленты зовут резолв каждая за своего автора в одном тике.
  it('резолвы за один тик уходят одной пачкой без пустых и повторов', async () => {
    const profiles = mountProfiles();

    profiles.resolveProfiles(['user-1']);
    profiles.resolveProfiles(['user-2', 'user-1', null, '']);

    await flushRequests();

    expect(fetchProfiles).toHaveBeenCalledTimes(1);

    expect(fetchProfiles.mock.calls[0]?.[1].body.userIds).toEqual([
      'user-1',
      'user-2',
    ]);

    expect(profiles.getProfile('user-1')?.avatarUrl).toBe(
      '/s3/avatars/user-1/1-avatar.webp',
    );
  });

  it('уже запрошенного пользователя повторно не запрашивает', async () => {
    const profiles = mountProfiles();

    profiles.resolveProfiles(['user-1']);
    await flushRequests();
    profiles.resolveProfiles(['user-1']);
    await flushRequests();

    expect(fetchProfiles).toHaveBeenCalledTimes(1);
  });

  it('больше 200 идентификаторов делит на пачки по лимиту core-api', async () => {
    const profiles = mountProfiles();

    const userIds = Array.from(
      { length: 450 },
      (_slot, index) => `user-${index}`,
    );

    profiles.resolveProfiles(userIds);
    await flushRequests();

    const batchSizes = fetchProfiles.mock.calls.map(
      ([, options]) => options.body.userIds.length,
    );

    expect(batchSizes).toEqual([200, 200, 50]);
  });

  it('после сбоя запроса тот же пользователь запрашивается снова', async () => {
    const profiles = mountProfiles();

    fetchProfiles.mockRejectedValueOnce(new Error('core-api unavailable'));
    profiles.resolveProfiles(['user-1']);
    await flushRequests();

    expect(profiles.getProfile('user-1')).toBeUndefined();

    profiles.resolveProfiles(['user-1']);
    await flushRequests();

    expect(fetchProfiles).toHaveBeenCalledTimes(2);
    expect(profiles.getProfile('user-1')?.displayName).toBe('Имя user-1');
  });

  it('ссылку не на хранилище сайта считает отсутствием аватарки', async () => {
    const profiles = mountProfiles();

    fetchProfiles.mockResolvedValueOnce([
      {
        userId: 'user-1',
        displayName: 'Имя',
        avatarUrl: 'https://evil.example/a.webp',
      },
    ]);

    profiles.resolveProfiles(['user-1']);
    await flushRequests();

    expect(profiles.getProfile('user-1')).toEqual({
      userId: 'user-1',
      displayName: 'Имя',
      avatarUrl: null,
    });
  });
});
