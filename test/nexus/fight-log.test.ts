import type { TrackerDetailed, TrackerParticipant } from '~initiative/model';

import { describe, expect, it } from 'vitest';

import { describeTrackerChange } from '~nexus/model';

/** Участник боя с разумными значениями по умолчанию. */
function participant(
  overrides: Partial<TrackerParticipant> = {},
): TrackerParticipant {
  return {
    id: 'participant-1',
    type: 'PLAYER',
    typeName: 'Игрок',
    name: 'Ториан',
    dead: false,
    initiativeBonus: 2,
    conditions: [],
    ...overrides,
  };
}

/** Трекер с разумными значениями по умолчанию. */
function tracker(overrides: Partial<TrackerDetailed> = {}): TrackerDetailed {
  return {
    id: 'tracker-1',
    name: 'Бой в таверне',
    status: 'PREPARING',
    statusName: 'Подготовка',
    round: 0,
    rerollEachRound: false,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    participants: [participant()],
    ...overrides,
  };
}

describe('пересказ боя для ленты комнаты', () => {
  it('молчит про первую загрузку', () => {
    // Иначе при каждом открытии трекера в ленту сыпался бы пересказ уже
    // случившегося.
    expect(describeTrackerChange(null, tracker({ status: 'ACTIVE' }))).toEqual(
      [],
    );
  });

  it('молчит про чужой бой', () => {
    const other = tracker({ id: 'tracker-2', status: 'ACTIVE' });

    expect(describeTrackerChange(tracker(), other)).toEqual([]);
  });

  it('объявляет начало и конец боя', () => {
    const preparing = tracker();
    const active = tracker({ status: 'ACTIVE', statusName: 'Бой', round: 1 });

    expect(describeTrackerChange(preparing, active)).toContain('Бой начат');
    expect(describeTrackerChange(active, preparing)).toEqual(['Бой завершён']);
  });

  it('называет персонажа, чей ход', () => {
    const before = tracker({ status: 'ACTIVE', round: 1 });

    const after = tracker({
      status: 'ACTIVE',
      round: 1,
      currentParticipantId: 'participant-1',
    });

    expect(describeTrackerChange(before, after)).toEqual([
      'Ход персонажа: Ториан',
    ]);
  });

  it('не выдаёт, кто именно ходит из существ', () => {
    const monster = participant({
      id: 'creature-1',
      type: 'CREATURE',
      typeName: 'Существо',
      name: 'Гоблин-вожак',
    });

    const before = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [monster],
    });

    const after = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [monster],
      currentParticipantId: 'creature-1',
    });

    // Состав засады раскрывает мастер, а не лента.
    expect(describeTrackerChange(before, after)).toEqual(['Ход существа']);
  });

  it('объявляет смену раунда', () => {
    const before = tracker({ status: 'ACTIVE', round: 1 });
    const after = tracker({ status: 'ACTIVE', round: 2 });

    expect(describeTrackerChange(before, after)).toEqual(['Раунд 2']);
  });

  it('считает урон и лечение персонажа', () => {
    const before = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [participant({ currentHitPoints: 20, maxHitPoints: 20 })],
    });

    const hurt = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [participant({ currentHitPoints: 13, maxHitPoints: 20 })],
    });

    expect(describeTrackerChange(before, hurt)).toEqual([
      'Ториан получает 7 урона',
    ]);

    expect(describeTrackerChange(hurt, before)).toEqual([
      'Ториан восстанавливает 7 хитов',
    ]);
  });

  it('не называет числа хитов существа', () => {
    const monster = (currentHitPoints: number): TrackerParticipant =>
      participant({
        id: 'creature-1',
        type: 'CREATURE',
        typeName: 'Существо',
        name: 'Гоблин-вожак',
        currentHitPoints,
      });

    const before = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [monster(15)],
    });

    const after = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [monster(4)],
    });

    // Сколько осталось у существа — знание мастера.
    expect(describeTrackerChange(before, after)).toEqual([
      'Существо получает урон',
    ]);
  });

  it('объявляет повержённых', () => {
    const before = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [participant({ currentHitPoints: 3 })],
    });

    const after = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [participant({ currentHitPoints: 0, dead: true })],
    });

    expect(describeTrackerChange(before, after)).toEqual([
      'Ториан получает 3 урона',
      'Ториан повержен',
    ]);
  });

  it('молчит про новичков в составе', () => {
    const before = tracker({ status: 'ACTIVE', round: 1 });

    const after = tracker({
      status: 'ACTIVE',
      round: 1,
      participants: [
        participant(),
        participant({ id: 'creature-1', type: 'CREATURE', name: 'Гоблин' }),
      ],
    });

    // Подкрепление мастер вводит сам — лента не должна его выдавать заранее.
    expect(describeTrackerChange(before, after)).toEqual([]);
  });
});
