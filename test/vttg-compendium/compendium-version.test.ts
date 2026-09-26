import type { VttgCompendiumRebuild } from '~admin/vttg-compendium/model';

import { describe, expect, it } from 'vitest';

import {
  getNextVttgCompendiumVersion,
  getVttgCompendiumUpdatedText,
  isVttgCompendiumRebuildRunning,
  parseVttgCompendiumVersion,
  VTTG_COMPENDIUM_UPDATED_LABEL,
  VTTG_COMPENDIUM_UPDATED_SEPARATOR,
} from '~admin/vttg-compendium/model';

const CURRENT_VERSION = 35;
const FORMATTED_DATE = '26.09.2026 16:48';
const ADMIN_USERNAME = 'admin';

/** Пересборка с заданным состоянием и без дат. */
function createRebuild(
  status: VttgCompendiumRebuild['status'],
): VttgCompendiumRebuild {
  return { status, startedAt: null, finishedAt: null, error: null };
}

describe('getNextVttgCompendiumVersion', () => {
  it('предлагает версию больше текущей', () => {
    expect(getNextVttgCompendiumVersion(CURRENT_VERSION)).toBeGreaterThan(
      CURRENT_VERSION,
    );
  });
});

describe('isVttgCompendiumRebuildRunning', () => {
  it('идёт только в состоянии RUNNING', () => {
    expect(isVttgCompendiumRebuildRunning(createRebuild('RUNNING'))).toBe(true);
    expect(isVttgCompendiumRebuildRunning(createRebuild('DONE'))).toBe(false);
    expect(isVttgCompendiumRebuildRunning(createRebuild('FAILED'))).toBe(false);
    expect(isVttgCompendiumRebuildRunning(createRebuild('IDLE'))).toBe(false);
  });
});

describe('getVttgCompendiumUpdatedText', () => {
  it('добавляет автора через разделитель', () => {
    expect(getVttgCompendiumUpdatedText(FORMATTED_DATE, ADMIN_USERNAME)).toBe(
      `${VTTG_COMPENDIUM_UPDATED_LABEL} ${FORMATTED_DATE}${VTTG_COMPENDIUM_UPDATED_SEPARATOR}${ADMIN_USERNAME}`,
    );
  });

  it('без автора оставляет только дату', () => {
    expect(getVttgCompendiumUpdatedText(FORMATTED_DATE, null)).toBe(
      `${VTTG_COMPENDIUM_UPDATED_LABEL} ${FORMATTED_DATE}`,
    );
  });
});

describe('parseVttgCompendiumVersion', () => {
  it('принимает ответ core-api', () => {
    const versionResponse = {
      version: CURRENT_VERSION,
      updatedAt: null,
      updatedBy: null,
      rebuild: createRebuild('IDLE'),
    };

    expect(parseVttgCompendiumVersion(versionResponse)).toEqual(
      versionResponse,
    );
  });

  it('отвергает неизвестное состояние пересборки', () => {
    expect(() =>
      parseVttgCompendiumVersion({
        version: CURRENT_VERSION,
        updatedAt: null,
        updatedBy: null,
        rebuild: { ...createRebuild('IDLE'), status: 'QUEUED' },
      }),
    ).toThrow();
  });
});
