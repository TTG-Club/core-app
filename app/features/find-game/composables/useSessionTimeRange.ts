import { Time } from '@internationalized/date';

import {
  durationBetween,
  MINUTES_IN_HOUR,
  SESSION_DEFAULT_END_HOUR,
  SESSION_DEFAULT_START_HOUR,
  SESSION_TIMEZONE_HINT_PREFIX,
} from '../model';

/**
 * Минуты от полуночи — в них считается длительность встречи.
 * @param time Время суток.
 */
function toMinutesOfDay(time: Time): number {
  return time.hour * MINUTES_IN_HOUR + time.minute;
}

/**
 * Двузначное число для склейки времени.
 * @param value Часы или минуты.
 */
function pad(value: number): string {
  return `${value}`.padStart(2, '0');
}

/**
 * Время встречи: начало, конец и вытекающая из них длительность.
 *
 * Одинаково нужно и одиночной сессии, и серии, поэтому живёт отдельно: два
 * поля вместо диапазона (диапазон не принимает конец раньше начала, а ночная
 * сессия ровно такая — «с 19:00 до 01:00»), одинаковая подсказка про часовой
 * пояс и одинаковый сброс при открытии окна.
 */
export function useSessionTimeRange() {
  // shallowRef: у `Time` приватные поля, и разворачивание ref их теряет.
  const startTime = shallowRef(new Time(SESSION_DEFAULT_START_HOUR, 0));
  const endTime = shallowRef(new Time(SESSION_DEFAULT_END_HOUR, 0));

  // Поле времени принимает его в поясе мастера, а игрокам оно покажется в их
  // собственном — смещение снимает разночтения.
  const { $dayjs } = useDayjs();

  const timezoneHint = computed(
    () => `${SESSION_TIMEZONE_HINT_PREFIX} (UTC${$dayjs().format('Z')})`,
  );

  /** Начало встречи как `HH:mm` — для склейки с датой. */
  const startTimeText = computed(
    () => `${pad(startTime.value.hour)}:${pad(startTime.value.minute)}`,
  );

  // Конец раньше начала считается как переход через полночь: длительность
  // берётся через сутки вперёд.
  const durationMinutes = computed(() =>
    durationBetween(
      toMinutesOfDay(startTime.value),
      toMinutesOfDay(endTime.value),
    ),
  );

  /** Возвращает время к вечеру по умолчанию. */
  function reset(): void {
    startTime.value = new Time(SESSION_DEFAULT_START_HOUR, 0);
    endTime.value = new Time(SESSION_DEFAULT_END_HOUR, 0);
  }

  return {
    startTime,
    endTime,
    startTimeText,
    durationMinutes,
    timezoneHint,

    reset,
  };
}
