import { describe, expect, it } from 'vitest';

// Прямо из модуля: баррел `~ui/video` тянет SFC — окружение тестов их не грузит.
import { getVideoPoster, parseVideoUrl } from '~ui/video/utils';

const YOUTUBE_ID = 'dQw4w9WgXcQ';
const YOUTUBE_WATCH = `https://www.youtube.com/watch?v=${YOUTUBE_ID}`;

describe('parseVideoUrl — YouTube', () => {
  it.each([
    YOUTUBE_WATCH,
    `https://youtube.com/watch?v=${YOUTUBE_ID}&list=abc`,
    `https://m.youtube.com/watch?v=${YOUTUBE_ID}`,
    `https://youtu.be/${YOUTUBE_ID}?si=share`,
    `youtu.be/${YOUTUBE_ID}`,
    `https://www.youtube.com/shorts/${YOUTUBE_ID}`,
    `https://www.youtube.com/live/${YOUTUBE_ID}`,
    `https://www.youtube.com/embed/${YOUTUBE_ID}`,
    `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`,
    `<iframe width="560" src="https://www.youtube.com/embed/${YOUTUBE_ID}" allowfullscreen></iframe>`,
  ])('распознаёт %s', (input) => {
    const source = parseVideoUrl(input);

    expect(source?.provider).toBe('youtube');
    expect(source?.url).toBe(YOUTUBE_WATCH);
    expect(source?.embedUrl).toContain(`/embed/${YOUTUBE_ID}?autoplay=1`);
    expect(source?.thumbnailUrl).toContain(YOUTUBE_ID);
  });

  it('сохраняет отметку времени', () => {
    const source = parseVideoUrl(`https://youtu.be/${YOUTUBE_ID}?t=1m30s`);

    expect(source?.url).toBe(`${YOUTUBE_WATCH}&t=90s`);
    expect(source?.embedUrl).toContain('start=90');
  });

  it('отклоняет ссылку без id', () => {
    expect(parseVideoUrl('https://www.youtube.com/@channel')).toBeNull();
    expect(parseVideoUrl('https://www.youtube.com/watch?v=short')).toBeNull();
  });
});

describe('parseVideoUrl — ВК Видео', () => {
  it.each([
    'https://vk.com/video-12345_67890',
    'https://vkvideo.ru/video-12345_67890',
    'https://m.vk.com/video-12345_67890',
    'https://vk.com/clip-12345_67890',
    'https://vk.com/club1?z=video-12345_67890%2Fpl_cat',
    'https://vk.com/video_ext.php?oid=-12345&id=67890',
  ])('распознаёт %s', (input) => {
    const source = parseVideoUrl(input);

    expect(source?.provider).toBe('vk');
    expect(source?.url).toBe('https://vk.com/video-12345_67890');

    expect(source?.embedUrl).toBe(
      'https://vk.com/video_ext.php?oid=-12345&id=67890&hd=2&autoplay=1',
    );

    expect(source?.thumbnailUrl).toBeNull();
  });

  it('сохраняет ключ доступа из кода для вставки', () => {
    const source = parseVideoUrl(
      '<iframe src="https://vk.com/video_ext.php?oid=-1&amp;id=2&amp;hash=ab12" allow="autoplay"></iframe>',
    );

    expect(source?.url).toBe(
      'https://vk.com/video_ext.php?oid=-1&id=2&hash=ab12',
    );

    expect(source?.embedUrl).toContain('hash=ab12');
  });
});

describe('parseVideoUrl — прочее', () => {
  it.each(['', '   ', 'просто текст', 'https://rutube.ru/video/abc/'])(
    'отклоняет «%s»',
    (input) => {
      expect(parseVideoUrl(input)).toBeNull();
    },
  );

  it('пустое значение — null', () => {
    expect(parseVideoUrl(null)).toBeNull();
    expect(parseVideoUrl(undefined)).toBeNull();
  });
});

describe('getVideoPoster', () => {
  it('своя обложка важнее превью площадки', () => {
    expect(getVideoPoster(YOUTUBE_WATCH, '/cover.webp')).toBe('/cover.webp');
  });

  it('без обложки — превью YouTube, у ВК — ничего', () => {
    expect(getVideoPoster(YOUTUBE_WATCH, null)).toContain(YOUTUBE_ID);
    expect(getVideoPoster('https://vk.com/video-1_2', null)).toBeNull();
    expect(getVideoPoster(null, null)).toBeNull();
  });
});
