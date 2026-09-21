import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computed,
  effectScope,
  onScopeDispose,
  ref,
  shallowRef,
  watch,
} from 'vue';

import { useGamePublications } from '~admin/game-publications/composables';
import {
  parsePublicationOverview,
  parsePublicationPreview,
  publicationChannelFormSchema,
  publicationChannelSchema,
  publicationSettingsFormSchema,
} from '~admin/game-publications/model';

const overview = {
  settings: { enabled: false, schedule: [], revision: 0, pausedUntil: null },
  channels: [],
  configured: true,
  telegramConfigured: true,
  vkConfigured: true,
  vkGroupConfigured: false,
  timeZone: 'Europe/Moscow',
};

const newChannel = publicationChannelFormSchema.parse({
  platform: 'DISCORD',
  telegramChatId: '',
  vkGroupId: '',
  name: 'Игры',
  enabled: true,
  inherit: true,
  isNew: true,
  revision: 0,
  schedule: [],
  webhookUrl: `https://discord.com/api/webhooks/123456789012345678/${'a'.repeat(60)}`,
});

const savedChannel = publicationChannelSchema.parse({
  id: 'ccbb61f1-f27c-4c26-aaf4-43b17c14e778',
  name: 'Тестовый канал',
  enabled: false,
  schedule: null,
  revision: 3,
  nextRunAt: null,
});

describe('валидация публикаций игр', () => {
  it('принимает прежний ответ API при последовательном обновлении сервиса и сайта', () => {
    const legacy = parsePublicationOverview({
      settings: overview.settings,
      configured: true,
      timeZone: 'Europe/Moscow',
      channels: [
        {
          id: savedChannel.id,
          name: 'Прежний канал',
          enabled: false,
          schedule: null,
          revision: 0,
          nextRunAt: null,
        },
      ],
    });

    expect(legacy.telegramConfigured).toBe(false);
    expect(legacy.vkConfigured).toBe(false);
    expect(legacy.vkGroupConfigured).toBe(false);
    expect(legacy.channels[0]?.platform).toBe('DISCORD');
  });

  it('проверяет ID Telegram, сохраняет прежний пустым полем и не возвращает секреты из API', () => {
    const telegramChannel = {
      ...newChannel,
      platform: 'TELEGRAM',
      webhookUrl: '',
      telegramChatId: ' -1001234567890 ',
    };

    expect(
      publicationChannelFormSchema.parse(telegramChannel).telegramChatId,
    ).toBe('-1001234567890');

    expect(
      publicationChannelFormSchema.safeParse({
        ...telegramChannel,
        isNew: false,
        telegramChatId: '',
      }).success,
    ).toBe(true);

    for (const telegramChatId of [
      '',
      '0',
      '1234',
      '-0',
      '-001',
      '-4503599627370496',
      '@channel',
      'https://t.me/channel',
    ]) {
      expect(
        publicationChannelFormSchema.safeParse({
          ...telegramChannel,
          telegramChatId,
        }).success,
      ).toBe(false);
    }

    const parsed = parsePublicationOverview({
      ...overview,
      channels: [
        {
          ...savedChannel,
          platform: 'TELEGRAM',
          telegramChatId: '-1001234567890',
          webhookUrl: 'secret',
        },
      ],
    });

    expect(parsed.channels[0]).not.toHaveProperty('telegramChatId');
    expect(parsed.channels[0]).not.toHaveProperty('webhookUrl');
  });

  it('проверяет ID сообщества ВКонтакте и не возвращает его из API', () => {
    const vkChannel = {
      ...newChannel,
      platform: 'VK',
      webhookUrl: '',
      vkGroupId: ' 212345678 ',
    };

    expect(publicationChannelFormSchema.parse(vkChannel).vkGroupId).toBe(
      '212345678',
    );

    expect(
      publicationChannelFormSchema.safeParse({
        ...vkChannel,
        vkGroupId: '-212345678',
      }).success,
    ).toBe(true);

    expect(
      publicationChannelFormSchema.safeParse({
        ...vkChannel,
        isNew: false,
        vkGroupId: '',
      }).success,
    ).toBe(true);

    expect(
      publicationChannelFormSchema.safeParse({ ...vkChannel, vkGroupId: '' })
        .success,
    ).toBe(false);

    // При заданном VK_GROUP_ID новый канал сохраняется без своего ID, но неверный ID отклоняется.
    expect(
      publicationChannelFormSchema.safeParse({
        ...vkChannel,
        vkGroupDefault: true,
        vkGroupId: '',
      }).success,
    ).toBe(true);

    expect(
      publicationChannelFormSchema.safeParse({
        ...vkChannel,
        vkGroupDefault: true,
        vkGroupId: 'club1',
      }).success,
    ).toBe(false);

    for (const vkGroupId of [
      '',
      '0',
      '-0',
      '012',
      'club212345678',
      'https://vk.com/club212345678',
      '1234567890123',
    ]) {
      expect(
        publicationChannelFormSchema.safeParse({ ...vkChannel, vkGroupId })
          .success,
      ).toBe(false);
    }

    const parsed = parsePublicationOverview({
      ...overview,
      channels: [{ ...savedChannel, platform: 'VK', vkGroupId: '212345678' }],
    });

    expect(parsed.channels[0]?.platform).toBe('VK');
    expect(parsed.channels[0]).not.toHaveProperty('vkGroupId');
  });

  it('при наследовании не проверяет скрытый черновик индивидуального расписания', () => {
    const draft = { ...newChannel, schedule: [{ day: 5, time: '' }] };

    expect(publicationChannelFormSchema.safeParse(draft).success).toBe(true);

    expect(
      publicationChannelFormSchema.safeParse({ ...draft, inherit: false })
        .success,
    ).toBe(false);

    expect(
      publicationChannelFormSchema.parse({
        ...newChannel,
        isNew: false,
        webhookUrl: '   ',
      }).webhookUrl,
    ).toBe('');

    expect(
      publicationChannelFormSchema.safeParse({
        ...newChannel,
        webhookUrl: '   ',
      }).success,
    ).toBe(false);
  });

  it('принимает наследование и требует вебхук у нового канала', () => {
    expect(publicationChannelFormSchema.safeParse(newChannel).success).toBe(
      true,
    );

    expect(
      publicationChannelFormSchema.safeParse({ ...newChannel, webhookUrl: '' })
        .success,
    ).toBe(false);

    expect(
      publicationChannelFormSchema.safeParse({
        ...newChannel,
        isNew: false,
        webhookUrl: '',
      }).success,
    ).toBe(true);
  });

  it('не принимает пустое индивидуальное расписание, повторы и неверное время', () => {
    expect(
      publicationChannelFormSchema.safeParse({ ...newChannel, inherit: false })
        .success,
    ).toBe(false);

    for (const schedule of [
      [],
      [{ day: 1, time: '25:00' }],
      [{ day: 0, time: '19:00' }],
      [
        { day: 1, time: '19:00' },
        { day: 1, time: '19:00' },
      ],
    ]) {
      expect(
        publicationSettingsFormSchema.safeParse({
          enabled: true,
          revision: 0,
          schedule,
        }).success,
      ).toBe(false);
    }

    expect(
      publicationSettingsFormSchema.safeParse({
        enabled: true,
        revision: 0,
        schedule: [
          { day: 1, time: '19:00' },
          { day: 4, time: '19:00' },
        ],
      }).success,
    ).toBe(true);
  });

  it('отклоняет подмену адреса вебхука и небезопасную ссылку предпросмотра', () => {
    expect(
      publicationChannelFormSchema.safeParse({
        ...newChannel,
        webhookUrl: newChannel.webhookUrl.replace(
          'discord.com',
          'discord.com.attacker.test',
        ),
      }).success,
    ).toBe(false);

    expect(() =>
      parsePublicationPreview([
        {
          id: 'ccbb61f1-f27c-4c26-aaf4-43b17c14e778',
          title: 'Игра',
          system: 'Система',
          genreSummary: 'Фэнтези',
          description: 'Короткое описание',
          takenSeats: 0,
          maxPlayers: 4,
          url: 'javascript:alert(1)',
        },
      ]),
    ).toThrow();

    expect(() =>
      parsePublicationOverview({
        ...overview,
        settings: { ...overview.settings, revision: '0' },
      }),
    ).toThrow();
  });

  it('принимает подборку с жанрами и отбрасывает описания прежнего API', () => {
    const game = {
      id: 'ccbb61f1-f27c-4c26-aaf4-43b17c14e778',
      title: 'Тайны города',
      system: 'Система',
      genreSummary: 'Фэнтези, Детектив',
      takenSeats: 1,
      maxPlayers: 4,
      url: 'https://new.ttg.club/games/ccbb61f1-f27c-4c26-aaf4-43b17c14e778',
    };

    expect(
      parsePublicationPreview(Array.from({ length: 8 }, () => game)),
    ).toHaveLength(8);

    expect(parsePublicationPreview([game])).toEqual([game]);

    // Фронтенд может обновиться раньше API: старый ответ не должен ломать админку.
    expect(
      parsePublicationPreview(Array.from({ length: 10 }, () => game)),
    ).toHaveLength(10);

    expect(
      parsePublicationPreview([
        { ...game, description: 'Найдите пропавшего мага.' },
      ]),
    ).toEqual([game]);

    expect(
      parsePublicationPreview([{ ...game, genreSummary: '' }]),
    ).toHaveLength(1);

    expect(() =>
      parsePublicationPreview(Array.from({ length: 11 }, () => game)),
    ).toThrow();

    for (const invalid of [
      { ...game, genreSummary: null },
      { ...game, genreSummary: 'Ж'.repeat(81) },
    ]) {
      expect(() => parsePublicationPreview([invalid])).toThrow();
    }
  });
});

describe('жизненный цикл настроек Discord', () => {
  const request = vi.fn();
  const administrator = ref(true);
  const sessionUser = ref({ id: 'admin-1', username: 'administrator' });

  const fetchStates: Array<{
    data: ReturnType<typeof shallowRef<unknown>>;
    clear: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof ref<string>>;
    error: ReturnType<typeof shallowRef<unknown>>;
  }> = [];

  const scopes: ReturnType<typeof effectScope>[] = [];

  beforeEach(() => {
    fetchStates.length = 0;
    request.mockReset();
    administrator.value = true;
    sessionUser.value = { id: 'admin-1', username: 'administrator' };
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('onScopeDispose', onScopeDispose);
    vi.stubGlobal('watch', watch);

    vi.stubGlobal('useUser', () => ({
      user: sessionUser,
      isAdmin: administrator,
    }));

    vi.stubGlobal('$fetch', request);

    vi.stubGlobal('useFetch', () => {
      const state = {
        data: shallowRef<unknown>(overview),
        status: ref('success'),
        error: shallowRef<unknown>(undefined),
        refresh: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn(() => {
          state.data.value = undefined;
          state.error.value = undefined;
          state.status.value = 'idle';
        }),
      };

      fetchStates.push(state);

      return state;
    });
  });

  afterEach(() => {
    scopes.forEach((scope) => scope.stop());
    scopes.length = 0;
    vi.unstubAllGlobals();
  });

  /** Запускает настоящий composable внутри управляемой области Vue. */
  function mount() {
    const scope = effectScope();

    scopes.push(scope);

    const publications = scope.run(useGamePublications);

    if (!publications) {
      throw new Error('Не удалось создать область');
    }

    return { scope, publications };
  }

  it('передаёт наследование как null и не дублирует сохранение', async () => {
    const { publications } = mount();

    let complete: ((response: unknown) => void) | undefined;

    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );

    const save = publications.saveChannel(null, newChannel);

    expect(await publications.saveChannel(null, newChannel)).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/channels'),
      expect.objectContaining({
        method: 'POST',
        retry: 0,
        body: expect.objectContaining({ schedule: null }),
      }),
    );

    complete?.(overview);
    expect(await save).toBe(true);
  });

  it('сохраняет ID Telegram без вебхука и передаёт тип платформы', async () => {
    const { publications } = mount();

    request.mockResolvedValueOnce(overview);

    const telegramChannel = publicationChannelFormSchema.parse({
      ...newChannel,
      platform: 'TELEGRAM',
      webhookUrl: '',
      telegramChatId: '-1001234567890',
    });

    expect(await publications.saveChannel(null, telegramChannel)).toBe(true);

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/channels'),
      expect.objectContaining({
        body: expect.objectContaining({
          platform: 'TELEGRAM',
          telegramChatId: '-1001234567890',
          webhookUrl: '',
          schedule: null,
        }),
        retry: 0,
      }),
    );
  });

  it('сохраняет ID сообщества ВКонтакте без адресов других платформ', async () => {
    const { publications } = mount();

    request.mockResolvedValueOnce(overview);

    const vkChannel = publicationChannelFormSchema.parse({
      ...newChannel,
      platform: 'VK',
      webhookUrl: '',
      vkGroupId: '212345678',
    });

    expect(await publications.saveChannel(null, vkChannel)).toBe(true);

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/channels'),
      expect.objectContaining({
        body: expect.objectContaining({
          platform: 'VK',
          vkGroupId: '212345678',
          telegramChatId: '',
          webhookUrl: '',
        }),
        retry: 0,
      }),
    );
  });

  it('отменяет запрос при уходе и не применяет поздний ответ', async () => {
    const { scope, publications } = mount();

    let complete: ((response: unknown) => void) | undefined;

    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );

    const save = publications.saveChannel(null, newChannel);
    const signal: unknown = request.mock.calls[0]?.[1]?.signal;

    scope.stop();
    expect(signal).toBeInstanceOf(AbortSignal);

    if (signal instanceof AbortSignal) {
      expect(signal.aborted).toBe(true);
    }

    complete?.({ ...overview, configured: false });
    expect(await save).toBe(false);
    expect(fetchStates[0]?.data.value).toBeUndefined();

    expect(
      fetchStates.every((state) => state.clear.mock.calls.length === 1),
    ).toBe(true);
  });

  it('сохраняет форму после конфликта и позволяет повторить запрос', async () => {
    const { publications } = mount();

    request
      .mockRejectedValueOnce({ statusCode: 409 })
      .mockResolvedValueOnce(overview);

    expect(await publications.saveChannel(null, newChannel)).toBe(false);
    expect(publications.failure.value).toContain('другой вкладке');
    expect(publications.busy.value).toBe(false);
    expect(await publications.saveChannel(null, newChannel)).toBe(true);
    expect(publications.failure.value).toBe('');
  });

  it('отправляет тест по кнопке один раз, без секрета и без изменения настроек', async () => {
    const { publications } = mount();

    let complete: ((response: unknown) => void) | undefined;

    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );

    expect(request).not.toHaveBeenCalled();

    const sending = publications.testChannel(savedChannel);

    expect(publications.testingChannelId.value).toBe(savedChannel.id);
    expect(publications.busy.value).toBe(true);
    expect(await publications.testChannel(savedChannel)).toBe(false);
    expect(await publications.saveChannel(null, newChannel)).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining(`/channels/${savedChannel.id}/test?revision=3`),
      expect.objectContaining({ method: 'POST', retry: 0, body: undefined }),
    );

    complete?.({ status: 'SENT', detail: 'Опубликовано' });
    expect(await sending).toBe(true);

    expect(publications.notice.value).toContain(
      'Тестовое сообщение доставлено',
    );

    expect(publications.notice.value).toContain(savedChannel.name);
    expect(publications.testingChannelId.value).toBeNull();
    expect(publications.busy.value).toBe(false);
    expect(fetchStates[0]?.data.value).toEqual(overview);
    expect(fetchStates[2]?.refresh).toHaveBeenCalledOnce();
  });

  it.each(['FAILED', 'UNKNOWN', 'SKIPPED'])(
    'не показывает успех при результате теста %s',
    async (status) => {
      const { publications } = mount();

      request.mockResolvedValueOnce({ status, detail: 'Проверьте канал' });
      expect(await publications.testChannel(savedChannel)).toBe(false);
      expect(publications.notice.value).toBe('');
      expect(publications.failure.value).toContain('Проверьте канал');
      expect(request).toHaveBeenCalledOnce();
      expect(fetchStates[2]?.refresh).toHaveBeenCalledOnce();
    },
  );

  it('отменяет ожидание теста и не показывает запоздавший успех после ухода', async () => {
    const { scope, publications } = mount();

    let complete: ((response: unknown) => void) | undefined;

    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );

    const sending = publications.testChannel(savedChannel);
    const signal: unknown = request.mock.calls[0]?.[1]?.signal;

    scope.stop();
    expect(signal).toBeInstanceOf(AbortSignal);

    if (signal instanceof AbortSignal) {
      expect(signal.aborted).toBe(true);
    }

    complete?.({ status: 'SENT', detail: 'Опубликовано' });
    expect(await sending).toBe(false);
    expect(publications.notice.value).toBe('');
    expect(fetchStates[2]?.refresh).not.toHaveBeenCalled();
  });

  it.each([
    [429, 'ограничение частоты'],
    [404, 'Канал удалён'],
    [409, 'другой вкладке'],
    [500, 'Нет подтверждения'],
  ])(
    'обрабатывает HTTP %s и позволяет новый тест только явным нажатием',
    async (statusCode, message) => {
      const { publications } = mount();

      request
        .mockRejectedValueOnce({ statusCode })
        .mockResolvedValueOnce({ status: 'SENT', detail: 'Опубликовано' });

      expect(await publications.testChannel(savedChannel)).toBe(false);
      expect(publications.failure.value).toContain(message);
      expect(publications.busy.value).toBe(false);
      expect(request).toHaveBeenCalledOnce();
      expect(await publications.testChannel(savedChannel)).toBe(true);
      expect(publications.failure.value).toBe('');
    },
  );

  it('отклоняет неверный ответ API вместо ложного подтверждения доставки', async () => {
    const { publications } = mount();

    request.mockResolvedValueOnce({ status: 'SENT' });
    expect(await publications.testChannel(savedChannel)).toBe(false);
    expect(publications.notice.value).toBe('');
    expect(publications.failure.value).toContain('Нет подтверждения');
  });

  it('не ждёт журнал и предпросмотр после подтверждения сохранения', async () => {
    const { publications } = mount();
    const historyState = fetchStates[2];
    const previewState = fetchStates[1];

    if (!historyState || !previewState) {
      throw new Error('Не созданы запросы');
    }

    let completeHistory: (() => void) | undefined;
    historyState.status.value = 'pending';
    previewState.status.value = 'pending';

    historyState.refresh.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          completeHistory = resolve;
        }),
    );

    request.mockResolvedValueOnce(overview);

    expect(await publications.saveChannel(null, newChannel)).toBe(true);
    expect(publications.busy.value).toBe(false);
    expect(publications.notice.value).toContain('сохранены');
    completeHistory?.();
  });

  it.each(['role', 'account', 'read', 'write'])(
    'очищает данные и отклоняет поздний ответ при потере доступа: %s',
    async (reason) => {
      const { publications } = mount();

      let complete: ((response: unknown) => void) | undefined;

      request.mockImplementation(
        () =>
          new Promise((resolve) => {
            complete = resolve;
          }),
      );

      const sending = publications.testChannel(savedChannel);
      const signal: unknown = request.mock.calls[0]?.[1]?.signal;

      if (reason === 'role') {
        administrator.value = false;
      } else if (reason === 'account') {
        sessionUser.value = { id: 'admin-2', username: 'other-administrator' };
      } else if (reason === 'read') {
        const historyState = fetchStates[2];

        if (!historyState) {
          throw new Error('Не создан запрос истории');
        }

        historyState.error.value = { statusCode: 403 };
      } else {
        complete?.({ status: 'SENT', detail: 'Опубликовано' });
        await sending;
        request.mockRejectedValueOnce({ statusCode: 401 });
        expect(await publications.testChannel(savedChannel)).toBe(false);
      }

      expect(publications.accessRevoked.value).toBe(true);

      if (signal instanceof AbortSignal) {
        expect(signal.aborted).toBe(true);
      }

      expect(fetchStates.every((state) => state.data.value === undefined)).toBe(
        true,
      );

      complete?.({ status: 'SENT', detail: 'Опубликовано' });

      if (reason !== 'write') {
        expect(await sending).toBe(false);
      }

      expect(publications.notice.value).toBe('');
      expect(publications.failure.value).toContain('Недостаточно прав');
      expect(await publications.testChannel(savedChannel)).toBe(false);
      await publications.refresh();
      expect(publications.failure.value).toContain('Недостаточно прав');
    },
  );
});
