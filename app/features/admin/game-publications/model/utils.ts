import type { PublicationSlot } from './types';

import { PUBLICATION_DAYS, PUBLICATION_TEXT } from './constants';

/** Описывает недельное расписание в часовом поясе сервиса. */
export function formatPublicationSchedule(schedule: PublicationSlot[]): string {
  return (
    schedule
      .map((slot) => {
        const weekDay = PUBLICATION_DAYS.find(
          (publicationDay) => publicationDay.value === slot.day,
        );

        // День вне недели сервис не отдаёт; если он всё же придёт, в подписи
        // остаётся время, а не слово «undefined».
        return weekDay ? `${weekDay.label} ${slot.time}` : slot.time;
      })
      .join(' · ') || PUBLICATION_TEXT.noSchedule
  );
}
