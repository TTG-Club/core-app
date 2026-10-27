import { describe, expect, it } from 'vitest';

import {
  getBugReportStatusLabel,
  isBugReportType,
  parseBugReportTypeQuery,
  resolveBugReportType,
  toBugReportTypeQuery,
} from '~bug-report/model';

describe('parseBugReportTypeQuery', () => {
  it('читает пожелания из адреса', () => {
    expect(parseBugReportTypeQuery('wish')).toBe('WISH');
  });

  it('считает багами отсутствие, пустое и мусорное значение', () => {
    expect(parseBugReportTypeQuery(undefined)).toBe('BUG');
    expect(parseBugReportTypeQuery(null)).toBe('BUG');
    expect(parseBugReportTypeQuery('')).toBe('BUG');
    expect(parseBugReportTypeQuery('WISH')).toBe('BUG');
    expect(parseBugReportTypeQuery(['wish'])).toBe('BUG');
  });
});

describe('toBugReportTypeQuery', () => {
  it('не пишет в адрес тип по умолчанию', () => {
    expect(toBugReportTypeQuery('BUG')).toBeUndefined();
    expect(toBugReportTypeQuery('WISH')).toBe('wish');
  });
});

describe('resolveBugReportType', () => {
  it('считает запись без типа багом (старый сервис)', () => {
    expect(resolveBugReportType(undefined)).toBe('BUG');
    expect(resolveBugReportType('WISH')).toBe('WISH');
  });
});

describe('isBugReportType', () => {
  it('пропускает только известные типы', () => {
    expect(isBugReportType('BUG')).toBe(true);
    expect(isBugReportType('WISH')).toBe(true);
    expect(isBugReportType('wish')).toBe(false);
    expect(isBugReportType(0)).toBe(false);
  });
});

describe('getBugReportStatusLabel', () => {
  it('подписывает статусы по типу записи', () => {
    expect(getBugReportStatusLabel('FIXED', 'BUG')).toBe('Исправлен');
    expect(getBugReportStatusLabel('FIXED', 'WISH')).toBe('Добавлено');
    expect(getBugReportStatusLabel('NEW', 'WISH')).toBe('Новое');
  });
});
