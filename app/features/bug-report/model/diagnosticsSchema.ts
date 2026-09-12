import type { BugReportDiagnostics } from './types';

import * as z from 'zod';

/**
 * Разбор снимка метрик производительности, приложенного к баг-репорту.
 *
 * Строку пишет клиент-отправитель (VTTG), а не мы: и содержимое, и сам факт
 * того, что это JSON, — внешние данные. Каждая секция разбирается отдельно и
 * при несовпадении формы отбрасывается в одиночку: клиент другой версии мог
 * переименовать поле внутри `client`, и это не повод терять `device`.
 */
const spanSchema = z.object({
  name: z.string(),
  totalMs: z.number(),
  count: z.number(),
  maxMs: z.number(),
});

const clientSchema = z.object({
  fps: z.number(),
  pingMs: z.number(),
  walls: z.object({
    total: z.number(),
    drawn: z.number(),
    cacheHits: z.number(),
  }),
  raycast: z.object({
    lastMs: z.number(),
    rays: z.number(),
    walls: z.number(),
    checks: z.number(),
  }),
  lightCache: z.object({ hits: z.number(), misses: z.number() }),
  quadTreeNodes: z.number(),
  frameSpans: z.array(spanSchema),
});

const serverSchema = z.object({
  loopLag: z.object({
    meanMs: z.number(),
    p99Ms: z.number(),
    maxMs: z.number(),
  }),
  clients: z.number(),
  topEvents: z.array(spanSchema),
});

const sceneSchema = z.object({
  kind: z.string(),
  width: z.number(),
  height: z.number(),
  tokens: z.number(),
  lightSources: z.number(),
  drawings: z.number(),
  customAreas: z.number(),
  measurementTemplates: z.number(),
  fogOfWar: z.boolean(),
  darknessLevel: z.number(),
});

const deviceSchema = z.object({
  userAgent: z.string(),
  platform: z.string(),
  cpuCores: z.number(),
  deviceMemoryGb: z.number(),
  gpu: z.string(),
  screen: z.string(),
  viewport: z.string(),
  jsHeapUsedMb: z.number(),
  jsHeapLimitMb: z.number(),
  isElectron: z.boolean(),
  appVersion: z.string(),
});

const bugReportDiagnosticsSchema: z.ZodType<BugReportDiagnostics> = z.object({
  v: z.number().catch(1),
  client: clientSchema.optional().catch(undefined),
  server: serverSchema.optional().catch(undefined),
  scene: sceneSchema.optional().catch(undefined),
  device: deviceSchema.optional().catch(undefined),
});

/**
 * Разбирает поле `diagnostics` баг-репорта.
 *
 * `null` означает «снимка нет»: поля не было вовсе, строка оказалась не JSON
 * или разобралась во что-то, чем снимок быть не может. Блок тогда не рисуется,
 * а сама карточка репорта остаётся рабочей.
 *
 * @param raw Сохранённая строка поля `diagnostics`.
 */
export function parseBugReportDiagnostics(
  raw: string | undefined,
): BugReportDiagnostics | null {
  if (!raw) {
    return null;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }

  const parsed = bugReportDiagnosticsSchema.safeParse(payload);

  return parsed.success ? parsed.data : null;
}
