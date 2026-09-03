import type { ReelParticipant, TrackerDetailed } from '~initiative/model';

import type { FightState, FightStateDraft } from './types';

/**
 * Снимок боя для комнаты.
 *
 * Трекер открыт только тому, кто ведёт игру, поэтому очередь ходов уезжает в
 * комнату отдельным снимком. Кладут в него ровно то, что за столом и так лежит
 * на виду: порядок, чей ход, кто пал. Существа остаются безымянными и без
 * картинок — состав засады раскрывает мастер, а не карусель.
 */

/** Имя бойца в снимке: существо не называется. */
function nameOf(participant: TrackerDetailed['participants'][number]): string {
  return participant.type === 'PLAYER' ? participant.name : 'Существо';
}

/**
 * Во что превращается состояние трекера для комнаты.
 *
 * @param tracker Состояние боя у мастера.
 * @returns Снимок для отправки в комнату.
 */
export function toFightStateDraft(tracker: TrackerDetailed): FightStateDraft {
  return {
    trackerId: tracker.id,
    round: Math.max(1, tracker.round),
    active: tracker.status === 'ACTIVE',
    currentParticipantId: tracker.currentParticipantId ?? null,
    participants: tracker.participants.map((participant) => ({
      id: participant.id,
      name: nameOf(participant),
      player: participant.type === 'PLAYER',
      dead: participant.dead,
      // Аватар персонажа группа и так знает; портрет существа выдал бы, кто
      // перед ней, — до того, как мастер это покажет.
      avatarUrl:
        participant.type === 'PLAYER'
          ? (participant.sheetLink?.avatarUrl ?? null)
          : null,
      color: participant.color ?? null,
    })),
  };
}

/**
 * Бойцы снимка в том виде, в каком их рисует карусель.
 * @param state Снимок боя из комнаты.
 */
export function toReelParticipants(state: FightState): Array<ReelParticipant> {
  return state.participants.map((participant) => ({
    id: participant.id,
    type: participant.player ? 'PLAYER' : 'CREATURE',
    name: participant.name,
    dead: participant.dead,
    color: participant.color ?? undefined,
    avatarUrl: participant.avatarUrl ?? undefined,
  }));
}
