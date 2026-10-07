import { describe, expect, it } from 'vitest';

import {
  NOTIFICATION_ICONS,
  NOTIFICATION_TEXTS,
  parseFollows,
} from '~find-game/model';

describe('разбор отметок', () => {
  const follow = {
    userId: 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f',
    createdAt: '2026-09-01T10:00:00Z',
  };

  it('читает отметку целиком', () => {
    const parsed = parseFollows([follow]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.userId).toBe(follow.userId);
    expect(parsed[0]?.createdAt).toBe(follow.createdAt);
  });

  it('битую запись выбрасывает поштучно', () => {
    // Одна испорченная строка не должна прятать весь список. Отметка без
    // идентификатора бесполезна: некого ни показать, ни позвать.
    const parsed = parseFollows([
      follow,
      { createdAt: '2026-09-01T10:00:00Z' },
    ]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.userId).toBe(follow.userId);
  });

  it('не список читает пустым', () => {
    expect(parseFollows(null)).toEqual([]);
  });
});

describe('новые поводы уведомить', () => {
  it('объявление игры и приглашение подписаны и со значками', () => {
    // Тексты собирает сайт: сервис присылает только повод.
    expect(NOTIFICATION_TEXTS.MASTER_PUBLISHED_GAME).toBeTruthy();
    expect(NOTIFICATION_TEXTS.GAME_INVITE).toBeTruthy();
    expect(NOTIFICATION_ICONS.MASTER_PUBLISHED_GAME).toBeTruthy();
    expect(NOTIFICATION_ICONS.GAME_INVITE).toBeTruthy();
  });
});
