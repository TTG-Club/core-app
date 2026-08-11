import type { TrackerParticipant } from '~initiative/model';

import { useCreatureSummaries } from './useCreatureSummaries';

/**
 * Картинка участника для ленты боя и строки состава: существу — аватар из
 * статблока бестиария, игроку — аватар привязанного листа персонажа. Битая
 * ссылка гасится по-разному: у существа её помечает общий кэш сводок, а у листа
 * пометить негде — такие участники запоминаются здесь, и токен падает на иконку
 * или инициалы.
 * @param participantsGetter Геттер актуального списка участников (реактивный).
 */
export function useParticipantAvatars(
  participantsGetter: () => Array<TrackerParticipant>,
) {
  const {
    imageFor: creatureImageFor,
    summaryFor,
    dropImage,
  } = useCreatureSummaries(participantsGetter);

  const brokenSheetAvatars = ref(new Set<string>());

  /**
   * URL картинки участника или `undefined` (картинки нет либо она битая).
   * @param participant Участник трекера.
   */
  function avatarFor(participant: TrackerParticipant): string | undefined {
    const creatureImage = creatureImageFor(participant);

    if (creatureImage) {
      return creatureImage;
    }

    if (brokenSheetAvatars.value.has(participant.id)) {
      return undefined;
    }

    return participant.sheetLink?.avatarUrl || undefined;
  }

  /**
   * Гасит битую картинку участника (по `@error` у `<img>`).
   * @param participant Участник трекера.
   */
  function dropAvatar(participant: TrackerParticipant): void {
    if (participant.creatureUrl) {
      dropImage(participant.creatureUrl);

      return;
    }

    brokenSheetAvatars.value.add(participant.id);
  }

  return { avatarFor, dropAvatar, summaryFor };
}
