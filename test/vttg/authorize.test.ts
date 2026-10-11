import { describe, expect, it } from 'vitest';

import {
  buildVttgAuthorizeCancelUrl,
  buildVttgAuthorizeReturnUrl,
  describeVttgAuthorizeError,
  parseVttgAuthorizeQuery,
  VTTG_AUTHORIZE_ERRORS,
} from '~vttg/model';

/**
 * Страница согласия показывает человеку адрес мира и на него же отправляет
 * справку о личности. Поэтому адрес из ссылки принимается только в чистом
 * виде — схема, хост и порт: всё остальное позволило бы спрятать за знакомым
 * хостом чужую страницу или увести справку мимо мира.
 */
describe('разбор ссылки мира', () => {
  it('принимает адрес мира, название и метку запроса', () => {
    expect(
      parseVttgAuthorizeQuery({
        world: 'https://my-world.vttg.ttg.club',
        name: 'Проклятие Страда',
        state: 'abc123',
      }),
    ).toEqual({
      worldOrigin: 'https://my-world.vttg.ttg.club',
      worldName: 'Проклятие Страда',
      state: 'abc123',
    });
  });

  it('название необязательно', () => {
    expect(
      parseVttgAuthorizeQuery({
        world: 'http://192.168.1.10:30501',
        state: 'abc123',
      }),
    ).toEqual({
      worldOrigin: 'http://192.168.1.10:30501',
      worldName: '',
      state: 'abc123',
    });
  });

  it('косая черта в конце адреса не мешает', () => {
    expect(
      parseVttgAuthorizeQuery({ world: 'http://localhost:30501/', state: 's' })
        ?.worldOrigin,
    ).toBe('http://localhost:30501');
  });

  it.each([
    ['путь', 'https://example.com/steal'],
    ['параметры', 'https://example.com?next=https://evil.example'],
    ['фрагмент', 'https://example.com#x'],
    ['учётные данные', 'https://ttg.club@evil.example'],
    ['не веб-схема', 'javascript:alert(1)'],
    ['схема файла', 'file:///etc/passwd'],
    ['не адрес', 'просто текст'],
  ])('отклоняет адрес, в котором есть %s', (_reason, world) => {
    expect(parseVttgAuthorizeQuery({ world, state: 's' })).toBeUndefined();
  });

  it('без метки запроса ссылка не подходит: мир не отличит свой ответ от чужого', () => {
    expect(
      parseVttgAuthorizeQuery({ world: 'https://example.com' }),
    ).toBeUndefined();

    expect(
      parseVttgAuthorizeQuery({ world: 'https://example.com', state: '' }),
    ).toBeUndefined();
  });

  it('повторённый параметр не принимается', () => {
    expect(
      parseVttgAuthorizeQuery({
        world: ['https://example.com', 'https://evil.example'],
        state: 's',
      }),
    ).toBeUndefined();
  });

  it('слишком длинное название и метка отклоняются', () => {
    expect(
      parseVttgAuthorizeQuery({
        world: 'https://example.com',
        name: 'я'.repeat(81),
        state: 's',
      }),
    ).toBeUndefined();

    expect(
      parseVttgAuthorizeQuery({
        world: 'https://example.com',
        state: 's'.repeat(129),
      }),
    ).toBeUndefined();
  });
});

describe('возврат в мир', () => {
  const request = {
    worldOrigin: 'http://192.168.1.10:30501',
    worldName: 'Мир',
    state: 'a b&c',
  };

  it('справка и метка едут во фрагменте адреса — на сервер они не уходят', () => {
    const url = new URL(buildVttgAuthorizeReturnUrl(request, 'ticket.value'));

    expect(url.origin).toBe('http://192.168.1.10:30501');
    expect(url.search).toBe('');

    const fragment = new URLSearchParams(url.hash.slice(1));

    expect(fragment.get('ttg-ticket')).toBe('ticket.value');
    expect(fragment.get('ttg-state')).toBe('a b&c');
  });

  it('отказ возвращает в мир без справки', () => {
    const fragment = new URLSearchParams(
      new URL(buildVttgAuthorizeCancelUrl(request)).hash.slice(1),
    );

    expect(fragment.get('ttg-denied')).toBe('1');
    expect(fragment.get('ttg-state')).toBe('a b&c');
    expect(fragment.has('ttg-ticket')).toBe(false);
  });
});

describe('сообщения об ошибках', () => {
  it('различает истёкшую сессию, плохой адрес и частые запросы', () => {
    expect(describeVttgAuthorizeError(401)).toBe(
      VTTG_AUTHORIZE_ERRORS.sessionExpired,
    );

    expect(describeVttgAuthorizeError(400)).toBe(
      VTTG_AUTHORIZE_ERRORS.badAddress,
    );

    expect(describeVttgAuthorizeError(429)).toBe(
      VTTG_AUTHORIZE_ERRORS.tooManyRequests,
    );
  });

  it('всё остальное — «временно недоступно», включая выключенную выдачу', () => {
    expect(describeVttgAuthorizeError(502)).toBe(
      VTTG_AUTHORIZE_ERRORS.unavailable,
    );

    expect(describeVttgAuthorizeError(undefined)).toBe(
      VTTG_AUTHORIZE_ERRORS.unavailable,
    );
  });
});
