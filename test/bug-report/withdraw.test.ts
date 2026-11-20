import { StatusCodes } from 'http-status-codes';
import { describe, expect, it } from 'vitest';

import {
  canWithdrawBugReport,
  getBugReportWithdrawErrorText,
  getMyBugReportApiUrl,
  isBugReportWithdrawOutdated,
  MY_BUGS_WITHDRAW_CONFLICT_TEXT,
  MY_BUGS_WITHDRAW_FAILURE_TEXT,
  MY_BUGS_WITHDRAW_NOT_FOUND_TEXT,
} from '~bug-report/model';

describe('canWithdrawBugReport', () => {
  it('разрешает отзыв, пока репорт не взяли в работу', () => {
    expect(canWithdrawBugReport('NEW')).toBe(true);
  });

  it('запрещает отзыв рассмотренных репортов', () => {
    expect(canWithdrawBugReport('WAIT')).toBe(false);
    expect(canWithdrawBugReport('FIXED')).toBe(false);
    expect(canWithdrawBugReport('REJECTED')).toBe(false);
  });
});

describe('getBugReportWithdrawErrorText', () => {
  it('объясняет 409 тем, что репорт уже в работе', () => {
    expect(getBugReportWithdrawErrorText(StatusCodes.CONFLICT)).toBe(
      MY_BUGS_WITHDRAW_CONFLICT_TEXT,
    );
  });

  it('объясняет 404 тем, что репорта уже нет', () => {
    expect(getBugReportWithdrawErrorText(StatusCodes.NOT_FOUND)).toBe(
      MY_BUGS_WITHDRAW_NOT_FOUND_TEXT,
    );
  });

  it('прочие сбои и отсутствие ручки — общий текст', () => {
    expect(getBugReportWithdrawErrorText(StatusCodes.METHOD_NOT_ALLOWED)).toBe(
      MY_BUGS_WITHDRAW_FAILURE_TEXT,
    );

    expect(
      getBugReportWithdrawErrorText(StatusCodes.INTERNAL_SERVER_ERROR),
    ).toBe(MY_BUGS_WITHDRAW_FAILURE_TEXT);

    expect(getBugReportWithdrawErrorText(undefined)).toBe(
      MY_BUGS_WITHDRAW_FAILURE_TEXT,
    );
  });
});

describe('isBugReportWithdrawOutdated', () => {
  it('после 409 и 404 список надо перечитать', () => {
    expect(isBugReportWithdrawOutdated(StatusCodes.CONFLICT)).toBe(true);
    expect(isBugReportWithdrawOutdated(StatusCodes.NOT_FOUND)).toBe(true);
  });

  it('после прочих сбоев список не трогаем', () => {
    expect(isBugReportWithdrawOutdated(StatusCodes.METHOD_NOT_ALLOWED)).toBe(
      false,
    );

    expect(isBugReportWithdrawOutdated(undefined)).toBe(false);
  });
});

describe('getMyBugReportApiUrl', () => {
  it('ведёт на свой репорт через прокси сайта', () => {
    expect(getMyBugReportApiUrl('42')).toBe('/api/bug-report/my/42');
  });
});
