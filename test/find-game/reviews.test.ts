import { describe, expect, it } from 'vitest';

import {
  getReputationLabel,
  parseMasterProfile,
  parseReputation,
  parseSessionReview,
  parseSessionReviews,
  REPUTATION_EMPTY_LABEL,
} from '~find-game/model';

describe('подпись репутации', () => {
  it('читается долей, а не средним баллом', () => {
    // Оценка бинарная, и «11 из 12» точнее любого числа с запятой.
    expect(
      getReputationLabel({ userId: 'u-1', recommended: 11, total: 12 }),
    ).toBe('11 из 12 сыграли бы снова');
  });

  it('без оценок говорит об этом прямо', () => {
    expect(
      getReputationLabel({ userId: 'u-1', recommended: 0, total: 0 }),
    ).toBe(REPUTATION_EMPTY_LABEL);

    expect(getReputationLabel(null)).toBe(REPUTATION_EMPTY_LABEL);
  });
});

describe('разбор оценок', () => {
  const review = {
    id: '3f9f0a7e-0d1a-4b64-9a2a-2f4b5c7d8e90',
    sessionId: '8b1f2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
    gameId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    authorId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    targetId: 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f',
    kind: 'MASTER_REVIEW',
    recommended: true,
    comment: 'Вёл ровно',
    createdAt: '2026-09-01T10:00:00Z',
  };

  it('читает вердикт и текст', () => {
    const parsed = parseSessionReview(review);

    expect(parsed.kind).toBe('MASTER_REVIEW');
    expect(parsed.recommended).toBe(true);
    expect(parsed.comment).toBe('Вёл ровно');
  });

  it('оценку без текста читает пустой, а не сломанной', () => {
    // Оценку ставят и молча: отсутствие отзыва — обычный случай.
    const parsed = parseSessionReview({ ...review, comment: null });

    expect(parsed.comment).toBeNull();
    expect(parsed.recommended).toBe(true);
  });

  it('битую запись выбрасывает поштучно', () => {
    const parsed = parseSessionReviews([review, { id: 'не-uuid' }]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe(review.id);
  });

  it('не список читает пустым', () => {
    expect(parseSessionReviews(null)).toEqual([]);
  });
});

describe('разбор репутации', () => {
  it('читает долю', () => {
    const parsed = parseReputation({
      userId: 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f',
      recommended: 3,
      total: 4,
    });

    expect(parsed.recommended).toBe(3);
    expect(parsed.total).toBe(4);
  });

  it('профиль мастера без репутации читается нулями', () => {
    // Сборка сервиса без оценок счётчиков не присылает — профиль всё равно
    // должен открыться.
    const profile = parseMasterProfile({
      userId: 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f',
      about: null,
      tabletopExperienceYears: null,
      recruitingGames: 2,
      closedGames: 1,
      cancelledGames: 0,
      completedSessions: 7,
    });

    expect(profile.recommended).toBe(0);
    expect(profile.reviews).toBe(0);
    expect(profile.completedSessions).toBe(7);
  });
});
