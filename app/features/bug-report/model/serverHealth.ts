import type {
  BugReportDiagnostics,
  BugReportDiagnosticsTimelineSample,
  BugReportServerLagCause,
  BugReportServerLagVerdict,
} from './types';

import {
  BUG_REPORT_SERVER_GC_SHARE,
  BUG_REPORT_SERVER_MACHINE_CPU_PERCENT,
  BUG_REPORT_SERVER_OWN_CPU_PERCENT,
  BUG_REPORT_SERVER_STALL_MS,
  BUG_REPORT_SERVER_TIMELINE_ROWS,
  BUG_REPORT_UPTIME_UNITS,
} from './constants';

/** Секунд в минуте */
const SECONDS_IN_MINUTE = 60;

/** Секунд в часе */
const SECONDS_IN_HOUR = 3600;

/** Секунд в сутках */
const SECONDS_IN_DAY = 86_400;

/**
 * Порядок причин при равном числе зависаний: сначала наши, потом чужие. Если
 * поровну, лучше лишний раз проверить свой код, чем списать его на машину.
 */
const CAUSE_PRIORITY: ReadonlyArray<BugReportServerLagCause> = [
  'own-code',
  'garbage-collection',
  'machine-busy',
  'process-stalled',
];

/**
 * Определяет причину одного зависшего интервала по его нагрузке.
 *
 * Проверки идут от самых надёжных признаков: занятое ядро процесса однозначно
 * говорит про наш код, а «ничего не было занято» — только то, что не видно,
 * чем именно сервер ждал.
 *
 * @param sample Зависший интервал из ленты.
 */
function classifyStalledSample(
  sample: BugReportDiagnosticsTimelineSample,
): BugReportServerLagCause {
  if (sample.gcMs >= sample.lagMaxMs * BUG_REPORT_SERVER_GC_SHARE) {
    return 'garbage-collection';
  }

  if (sample.processCpu >= BUG_REPORT_SERVER_OWN_CPU_PERCENT) {
    return 'own-code';
  }

  if (sample.systemCpu >= BUG_REPORT_SERVER_MACHINE_CPU_PERCENT) {
    return 'machine-busy';
  }

  return 'process-stalled';
}

/**
 * Находит самое частое значение в списке.
 *
 * @param values Значения; пустые строки не считаются.
 */
function findMostFrequent(values: ReadonlyArray<string>): string {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  let winner = '';
  let winnerCount = 0;

  for (const [value, count] of counts) {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  }

  return winner;
}

/**
 * Делает вывод, чья это проблема, когда сервер мира тормозил.
 *
 * Каждый зависший двухсекундный интервал ленты получает свою причину, итог —
 * причина большинства. Без ленты (репорт из старой версии VTTG или из панели
 * управления без запущенного мира) вывода нет.
 *
 * @param diagnostics Разобранный снимок метрик.
 */
export function getServerLagVerdict(
  diagnostics: BugReportDiagnostics,
): BugReportServerLagVerdict | null {
  const timeline = diagnostics.serverTimeline;

  if (!timeline?.length) {
    return null;
  }

  const stalled = timeline.filter(
    (sample) => sample.lagMaxMs >= BUG_REPORT_SERVER_STALL_MS,
  );

  const worstLagMs = Math.max(...timeline.map((sample) => sample.lagMaxMs));

  if (stalled.length === 0) {
    return {
      cause: 'calm',
      stalledSamples: 0,
      totalSamples: timeline.length,
      worstLagMs,
      suspectEvent: '',
    };
  }

  const causeCounts = new Map<BugReportServerLagCause, number>();

  for (const sample of stalled) {
    const sampleCause = classifyStalledSample(sample);

    causeCounts.set(sampleCause, (causeCounts.get(sampleCause) ?? 0) + 1);
  }

  const dominantCause = CAUSE_PRIORITY.reduce((best, candidate) =>
    (causeCounts.get(candidate) ?? 0) > (causeCounts.get(best) ?? 0)
      ? candidate
      : best,
  );

  return {
    cause: dominantCause,
    stalledSamples: stalled.length,
    totalSamples: timeline.length,
    worstLagMs,
    suspectEvent: findMostFrequent(
      stalled.map((sample) => sample.heaviestEvent),
    ),
  };
}

/**
 * Переводит длительность в секундах в короткую подпись: «3 д 4 ч», «2 ч 15 мин»,
 * «40 с». Две старшие единицы — точнее для «сколько работает сервер» не нужно.
 *
 * @param totalSeconds Длительность в секундах.
 */
export function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);

  const minutes = Math.floor(
    (totalSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE,
  );

  const units = BUG_REPORT_UPTIME_UNITS;

  if (days > 0) {
    return `${days} ${units.days} ${hours} ${units.hours}`;
  }

  if (hours > 0) {
    return `${hours} ${units.hours} ${minutes} ${units.minutes}`;
  }

  if (minutes > 0) {
    return `${minutes} ${units.minutes}`;
  }

  return `${Math.round(totalSeconds)} ${units.seconds}`;
}

/**
 * Отбирает из ленты самые долгие зависания для таблицы — от самого долгого.
 * Интервалы без зависания в таблицу не попадают: они есть в сыром JSON.
 *
 * @param diagnostics Разобранный снимок метрик.
 */
export function getWorstServerStalls(
  diagnostics: BugReportDiagnostics,
): BugReportDiagnosticsTimelineSample[] {
  return (diagnostics.serverTimeline ?? [])
    .filter((sample) => sample.lagMaxMs >= BUG_REPORT_SERVER_STALL_MS)
    .sort((first, second) => second.lagMaxMs - first.lagMaxMs)
    .slice(0, BUG_REPORT_SERVER_TIMELINE_ROWS);
}
