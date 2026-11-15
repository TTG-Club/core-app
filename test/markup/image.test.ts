import { describe, expect, it } from 'vitest';

// Прямо из модуля: баррел `~ui/markup` тянет SFC — окружение тестов их не грузит.
import {
  buildImageMarker,
  getImageNarrowWidth,
  getImageWidth,
  isImageUrl,
  readImageAttributes,
  sanitizeImageText,
} from '~ui/markup/image';

describe('картинка в разметке', () => {
  it('пропускает только путь на сайте и ссылки http(s)', () => {
    expect(isImageUrl('/s3/articles/user/map.webp')).toBe(true);
    expect(isImageUrl('https://example.com/map.png')).toBe(true);
    expect(isImageUrl('//example.com/map.png')).toBe(false);
    expect(isImageUrl('javascript:alert(1)')).toBe(false);
    expect(isImageUrl('/s3/a b.webp')).toBe(false);
    expect(isImageUrl('/s3/a}.webp')).toBe(false);
  });

  it('без адреса настройки не читаются', () => {
    expect(readImageAttributes(undefined)).toBeUndefined();
    expect(readImageAttributes({ float: 'left' })).toBeUndefined();

    expect(
      readImageAttributes({ url: 'data:image/png;base64,AAA' }),
    ).toBeUndefined();
  });

  it('отбрасывает кривые значения и держит ширину в пределах', () => {
    expect(
      readImageAttributes({
        url: '/s3/a.webp',
        float: 'center',
        width: 500,
        alt: 123,
        caption: 'Дракон | {красный}',
      }),
    ).toEqual({
      url: '/s3/a.webp',
      float: undefined,
      align: undefined,
      width: 100,
      alt: '123',
      caption: 'Дракон красный',
    });

    expect(
      readImageAttributes({ url: '/s3/a.webp', width: 'широко' })?.width,
    ).toBeUndefined();
  });

  it('ширина по умолчанию зависит от обтекания', () => {
    expect(getImageWidth({ url: '/s3/a.webp' })).toBe(100);
    expect(getImageWidth({ url: '/s3/a.webp', float: 'left' })).toBe(40);

    expect(getImageWidth({ url: '/s3/a.webp', float: 'left', width: 25 })).toBe(
      25,
    );
  });

  it('в узкой колонке картинка держит размер широкой, пока помещается', () => {
    expect(getImageNarrowWidth({ url: '/s3/a.webp', width: 25 })).toBe(
      'min(100%, 180px)',
    );

    expect(getImageNarrowWidth({ url: '/s3/a.webp', float: 'left' })).toBe(
      'min(100%, 288px)',
    );

    expect(getImageNarrowWidth({ url: '/s3/a.webp' })).toBe('min(100%, 720px)');
  });

  it('собирает маркер без пустых значений', () => {
    expect(buildImageMarker({ url: '/s3/a.webp' })).toBe(
      '{@image | url:/s3/a.webp}',
    );

    expect(
      buildImageMarker({
        url: '/s3/a.webp',
        float: 'right',
        width: 33,
        caption: 'Карта долины',
      }),
    ).toBe(
      '{@image | url:/s3/a.webp | float:right | width:33 | caption:Карта долины}',
    );
  });

  it('выравнивание читается только к левому и правому краю', () => {
    expect(
      readImageAttributes({ url: '/s3/a.webp', align: 'right' })?.align,
    ).toBe('right');

    expect(
      readImageAttributes({ url: '/s3/a.webp', align: 'center' })?.align,
    ).toBeUndefined();

    expect(
      buildImageMarker({ url: '/s3/a.webp', align: 'left', width: 25 }),
    ).toBe('{@image | url:/s3/a.webp | align:left | width:25}');
  });

  it('чистит подпись от символов, ломающих маркер', () => {
    expect(sanitizeImageText('  Гора {@b Огня}\nи | лес ')).toBe(
      'Гора @b Огня и лес',
    );
  });
});
