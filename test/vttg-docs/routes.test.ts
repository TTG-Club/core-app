import { describe, expect, it } from 'vitest';

import {
  getVttgDocsIndexRoute,
  getVttgDocsPagePath,
  getVttgDocsPageRoute,
  parseVttgDocsChannel,
  vttgDocsSettingsSchema,
  vttgDocsSettingsUpdateSchema,
} from '#shared/utils';
import {
  findVttgDocsActiveHeadingId,
  formatVttgDocsSubtitle,
  getVttgDocsAccessDataKey,
  getVttgDocsLinkAction,
  getVttgDocsLoadFailure,
  getVttgDocsTocLinkClass,
  toVttgDocsRouteParam,
} from '~vttg-docs/model';

const QUICK_START_PAGE = { groupSlug: 'systems', pageSlug: 'quick-start' };

const ACTIVE_OFFSET = 96;

describe('адреса раздела документации VTTG', () => {
  it('у релиза адрес без канала, у dev — с каналом', () => {
    expect(getVttgDocsPagePath('release', QUICK_START_PAGE)).toBe(
      '/vttg/docs/systems/quick-start',
    );

    expect(getVttgDocsPagePath('dev', QUICK_START_PAGE)).toBe(
      '/vttg/docs/systems/quick-start?channel=dev',
    );
  });

  it('адрес для роутера несёт канал в query', () => {
    expect(getVttgDocsPageRoute('dev', QUICK_START_PAGE)).toEqual({
      path: '/vttg/docs/systems/quick-start',
      query: { channel: 'dev' },
    });

    expect(getVttgDocsIndexRoute('release')).toEqual({
      path: '/vttg/docs',
      query: {},
    });
  });

  it('неизвестный или пустой канал в адресе — релиз', () => {
    expect(parseVttgDocsChannel('dev')).toBe('dev');
    expect(parseVttgDocsChannel('beta')).toBe('release');
    expect(parseVttgDocsChannel('')).toBe('release');
    expect(parseVttgDocsChannel(['dev'])).toBe('release');
  });

  it('параметр адреса-массив не принимается за slug', () => {
    expect(toVttgDocsRouteParam('modules')).toBe('modules');
    expect(toVttgDocsRouteParam(['modules'])).toBe('');
  });
});

describe('страница документации VTTG на сайте', () => {
  it('подзаголовок собирается из группы, версии и даты', () => {
    expect(
      formatVttgDocsSubtitle({
        groupTitle: 'Модули',
        version: '0.9.330',
        formattedReleaseDate: '19 ноября 2026 г.',
      }),
    ).toBe('Модули · VTTG 0.9.330 · обновлено 19 ноября 2026 г.');

    expect(formatVttgDocsSubtitle({ version: '0.9.330' })).toBe('VTTG 0.9.330');
  });

  it('клик по якорю прокручивает, по адресу сайта — идёт роутером', () => {
    expect(getVttgDocsLinkAction('#пример', '')).toBe('anchor');

    expect(getVttgDocsLinkAction('/vttg/docs/modules/overview', '')).toBe(
      'route',
    );

    expect(getVttgDocsLinkAction('https://nuxt.com', '_blank')).toBe('browser');
  });

  it('третий уровень заголовка в оглавлении сдвинут, текущий выделен', () => {
    expect(getVttgDocsTocLinkClass(2, false)[0]).toBe('pl-3');
    expect(getVttgDocsTocLinkClass(3, false)[0]).toBe('pl-6');
    expect(getVttgDocsTocLinkClass(2, true)[1]).toContain('text-primary');
  });

  it('текущий заголовок — последний, поднявшийся к верху окна', () => {
    const headingPositions = [
      { id: 'obzor', top: -400 },
      { id: 'primer', top: 40 },
      { id: 'detali', top: 600 },
    ];

    expect(
      findVttgDocsActiveHeadingId(headingPositions, ACTIVE_OFFSET, false),
    ).toBe('primer');
  });

  it('пока ни один заголовок не поднялся, текущий — первый', () => {
    expect(
      findVttgDocsActiveHeadingId(
        [
          { id: 'obzor', top: 300 },
          { id: 'primer', top: 900 },
        ],
        ACTIVE_OFFSET,
        false,
      ),
    ).toBe('obzor');
  });

  it('в самом низу страницы текущий — последний заголовок', () => {
    expect(
      findVttgDocsActiveHeadingId(
        [
          { id: 'obzor', top: -900 },
          { id: 'primer', top: 300 },
        ],
        ACTIVE_OFFSET,
        true,
      ),
    ).toBe('primer');
  });

  it('доступ перечитывается при смене ролей, порядок ролей не важен', () => {
    expect(getVttgDocsAccessDataKey([])).toBe('vttg-docs-access:guest');

    expect(getVttgDocsAccessDataKey(['USER', 'MODERATOR'])).toBe(
      getVttgDocsAccessDataKey(['MODERATOR', 'USER']),
    );
  });

  it('код ответа определяет заглушку', () => {
    expect(getVttgDocsLoadFailure(createStatusError(403))).toBe('forbidden');
    expect(getVttgDocsLoadFailure(createStatusError(401))).toBe('forbidden');
    expect(getVttgDocsLoadFailure(createStatusError(404))).toBe('not-found');
    expect(getVttgDocsLoadFailure(createStatusError(502))).toBe('error');
    expect(getVttgDocsLoadFailure(new Error('сеть'))).toBe('error');
  });
});

describe('настройка dev-канала документации VTTG', () => {
  it('повторы ролей убираются, чужие имена не принимаются', () => {
    expect(
      vttgDocsSettingsUpdateSchema.parse({
        isReleaseChannelPublic: false,
        releaseChannelRoles: ['USER', 'USER'],
        devChannelRoles: ['MODERATOR', 'MODERATOR', 'TESTER'],
      }),
    ).toEqual({
      isReleaseChannelPublic: false,
      releaseChannelRoles: ['USER'],
      devChannelRoles: ['MODERATOR', 'TESTER'],
    });

    expect(
      vttgDocsSettingsUpdateSchema.safeParse({
        isReleaseChannelPublic: true,
        releaseChannelRoles: [],
        devChannelRoles: ['tester'],
      }).success,
    ).toBe(false);
  });

  it('файл настройки без полей релиза читается как «релиз открыт всем»', () => {
    expect(
      vttgDocsSettingsSchema.parse({
        devChannelRoles: ['MODERATOR'],
        updatedAt: null,
        updatedBy: null,
      }),
    ).toMatchObject({ isReleaseChannelPublic: true, releaseChannelRoles: [] });
  });
});

/**
 * Ошибка запроса с кодом ответа — как у `FetchError` и `NuxtError`.
 *
 * @param statusCode код ответа
 */
function createStatusError(statusCode: number): Error {
  return Object.assign(new Error('запрос'), { statusCode });
}
