import type { BugReportDiagnosticsTimelineSample } from '~bug-report/model';

import { describe, expect, it } from 'vitest';

import {
  formatUptime,
  getServerLagVerdict,
  getWorstServerStalls,
  parseBugReportDiagnostics,
} from '~bug-report/model';

/**
 * Собирает двухсекундный снапшот ленты: по умолчанию спокойный, нужное
 * переопределяется.
 *
 * @param overrides Поля, отличающиеся от спокойного снапшота.
 */
function makeSample(
  overrides: Partial<BugReportDiagnosticsTimelineSample>,
): BugReportDiagnosticsTimelineSample {
  return {
    agoSec: 10,
    lagMeanMs: 1,
    lagMaxMs: 5,
    processCpu: 5,
    systemCpu: 10,
    gcMs: 0,
    rssMb: 300,
    heaviestEvent: 'ping',
    heaviestEventMs: 0.3,
    ...overrides,
  };
}

describe('вывод о причине тормозов сервера', () => {
  it('без ленты вывода нет — старый репорт или панель управления', () => {
    expect(getServerLagVerdict({ v: 1 })).toBeNull();
  });

  it('сервер не зависал', () => {
    const verdict = getServerLagVerdict({
      v: 1,
      serverTimeline: [makeSample({}), makeSample({ lagMaxMs: 40 })],
    });

    expect(verdict).toMatchObject({ cause: 'calm', worstLagMs: 40 });
  });

  it('процесс съел ядро — наш код, с подозреваемым событием', () => {
    const verdict = getServerLagVerdict({
      v: 1,
      serverTimeline: [
        makeSample({
          lagMaxMs: 3400,
          processCpu: 98,
          heaviestEvent: 'token:move',
        }),
        makeSample({
          lagMaxMs: 900,
          processCpu: 91,
          heaviestEvent: 'token:move',
        }),
        makeSample({}),
      ],
    });

    expect(verdict).toMatchObject({
      cause: 'own-code',
      stalledSamples: 2,
      totalSamples: 3,
      suspectEvent: 'token:move',
    });
  });

  it('процесс спокоен, машина занята — чужие программы', () => {
    const verdict = getServerLagVerdict({
      v: 1,
      serverTimeline: [
        makeSample({ lagMaxMs: 3400, processCpu: 8, systemCpu: 97 }),
      ],
    });

    expect(verdict?.cause).toBe('machine-busy');
  });

  it('всё простаивает, а сервер стоит — сон, диск, подкачка', () => {
    const verdict = getServerLagVerdict({
      v: 1,
      serverTimeline: [
        makeSample({ lagMaxMs: 6000, processCpu: 2, systemCpu: 12 }),
      ],
    });

    expect(verdict?.cause).toBe('process-stalled');
  });

  it('долгая сборка мусора', () => {
    const verdict = getServerLagVerdict({
      v: 1,
      serverTimeline: [
        makeSample({ lagMaxMs: 800, processCpu: 95, gcMs: 600 }),
      ],
    });

    expect(verdict?.cause).toBe('garbage-collection');
  });

  it('таблица — только зависания, от самого долгого', () => {
    const stalls = getWorstServerStalls({
      v: 1,
      serverTimeline: [
        makeSample({ agoSec: 30, lagMaxMs: 300 }),
        makeSample({ agoSec: 20 }),
        makeSample({ agoSec: 10, lagMaxMs: 3000 }),
      ],
    });

    expect(stalls.map((sample) => sample.agoSec)).toEqual([10, 30]);
  });
});

describe('разбор новых секций снимка', () => {
  it('битая лента не съедает остальной снимок', () => {
    const diagnostics = parseBugReportDiagnostics(
      JSON.stringify({
        v: 1,
        serverTimeline: [{ agoSec: 'вчера' }],
        serverHost: { cpuModel: 'Ryzen' },
        device: undefined,
      }),
    );

    expect(diagnostics).toMatchObject({ v: 1 });
    expect(diagnostics?.serverTimeline).toBeUndefined();
    expect(diagnostics?.serverHost).toBeUndefined();
  });
});

describe('подпись времени работы', () => {
  it('две старшие единицы', () => {
    expect(formatUptime(40)).toBe('40 с');
    expect(formatUptime(125)).toBe('2 мин');
    expect(formatUptime(2 * 3600 + 15 * 60)).toBe('2 ч 15 мин');
    expect(formatUptime(3 * 86_400 + 4 * 3600)).toBe('3 д 4 ч');
  });
});
