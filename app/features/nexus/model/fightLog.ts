import type { TrackerDetailed, TrackerParticipant } from '~initiative/model';

/**
 * Пересказ боя для ленты комнаты.
 *
 * Трекер открыт только тому, кто ведёт игру, поэтому остальные следят за боем
 * по чату. Пересказывается лишь то, что за столом и так объявляют вслух:
 * начало боя, чей ход, кому досталось. Существа остаются безымянными — их
 * состав и запас хитов мастер раскрывает сам, а не через ленту.
 */

/** Имя участника в ленте: существо не называется. */
function nameOf(participant: TrackerParticipant): string {
  return participant.type === 'PLAYER' ? participant.name : 'Существо';
}

/** Начало и конец боя. */
function describeStatus(
  previous: TrackerDetailed,
  next: TrackerDetailed,
): Array<string> {
  if (previous.status === next.status) {
    return [];
  }

  return [next.status === 'ACTIVE' ? 'Бой начат' : 'Бой завершён'];
}

/** Смена раунда и переход хода. */
function describeTurn(
  previous: TrackerDetailed,
  next: TrackerDetailed,
): Array<string> {
  if (next.status !== 'ACTIVE') {
    return [];
  }

  const lines: Array<string> = [];

  if (next.round !== previous.round) {
    lines.push(`Раунд ${next.round}`);
  }

  if (next.currentParticipantId === previous.currentParticipantId) {
    return lines;
  }

  const current = next.participants.find(
    (participant) => participant.id === next.currentParticipantId,
  );

  if (!current) {
    return lines;
  }

  lines.push(
    current.type === 'PLAYER'
      ? `Ход персонажа: ${current.name}`
      : 'Ход существа',
  );

  return lines;
}

/**
 * Урон и лечение одного участника.
 *
 * Числа называются только для персонажей: сколько осталось у существа —
 * знание мастера, и лента его не выдаёт.
 */
function describeHitPoints(
  before: TrackerParticipant,
  after: TrackerParticipant,
): Array<string> {
  const wasHit = before.currentHitPoints;
  const nowHit = after.currentHitPoints;

  if (wasHit === undefined || nowHit === undefined || wasHit === nowHit) {
    return [];
  }

  const delta = nowHit - wasHit;
  const name = nameOf(after);

  if (after.type !== 'PLAYER') {
    return [delta < 0 ? `${name} получает урон` : `${name} лечится`];
  }

  return [
    delta < 0
      ? `${name} получает ${-delta} урона`
      : `${name} восстанавливает ${delta} хитов`,
  ];
}

/** Кто пал, а кто поднялся. */
function describeDead(
  before: TrackerParticipant,
  after: TrackerParticipant,
): Array<string> {
  if (before.dead === after.dead) {
    return [];
  }

  const name = nameOf(after);

  if (after.type !== 'PLAYER') {
    return [after.dead ? `${name} повержено` : `${name} снова в бою`];
  }

  return [after.dead ? `${name} повержен` : `${name} снова в бою`];
}

/** Что стало с составом боя. */
function describeParticipants(
  previous: TrackerDetailed,
  next: TrackerDetailed,
): Array<string> {
  const before = new Map(
    previous.participants.map((participant) => [participant.id, participant]),
  );

  return next.participants.flatMap((participant) => {
    const was = before.get(participant.id);

    if (!was) {
      return [];
    }

    return [
      ...describeHitPoints(was, participant),
      ...describeDead(was, participant),
    ];
  });
}

/**
 * Во что превратилось изменение боя для ленты комнаты.
 *
 * @param previous Состояние до действия мастера; `null` — бой только открыли.
 * @param next Состояние после.
 * @returns Строки событий по порядку; пусто — рассказывать нечего.
 */
export function describeTrackerChange(
  previous: TrackerDetailed | null,
  next: TrackerDetailed,
): Array<string> {
  // Первая загрузка — не событие: иначе при каждом открытии трекера в ленту
  // сыпался бы пересказ уже случившегося.
  if (!previous || previous.id !== next.id) {
    return [];
  }

  return [
    ...describeStatus(previous, next),
    ...describeTurn(previous, next),
    ...describeParticipants(previous, next),
  ];
}
