import { describe, expect, it } from 'vitest';

import {
  formatCustomThemeHexColor,
  getCustomThemeHexFieldText,
  parseCustomThemeHexColor,
} from '~infrastructure/custom-theme/model';

describe('parseCustomThemeHexColor', () => {
  it('принимает шесть цифр с решёткой и без, в любом регистре', () => {
    expect(parseCustomThemeHexColor('#A1B2C3')).toBe('#a1b2c3');
    expect(parseCustomThemeHexColor('a1b2c3')).toBe('#a1b2c3');
  });

  it('раскрывает короткую запись', () => {
    expect(parseCustomThemeHexColor('#ABC')).toBe('#aabbcc');
    expect(parseCustomThemeHexColor('f0a')).toBe('#ff00aa');
  });

  it('прощает пробелы по краям', () => {
    expect(parseCustomThemeHexColor('  #123456 ')).toBe('#123456');
  });

  it('отвергает неверный код', () => {
    expect(parseCustomThemeHexColor('')).toBeUndefined();
    expect(parseCustomThemeHexColor('#')).toBeUndefined();
    expect(parseCustomThemeHexColor('#abcd')).toBeUndefined();
    expect(parseCustomThemeHexColor('#ggg')).toBeUndefined();
    expect(parseCustomThemeHexColor('##abc')).toBeUndefined();
    expect(parseCustomThemeHexColor('#1234567')).toBeUndefined();
  });
});

describe('formatCustomThemeHexColor', () => {
  it('пишет код заглавными', () => {
    expect(formatCustomThemeHexColor('#a1b2c3')).toBe('#A1B2C3');
  });
});

describe('getCustomThemeHexFieldText', () => {
  it('без набора показывает текущий цвет', () => {
    expect(getCustomThemeHexFieldText(undefined, '#a1b2c3')).toBe('#A1B2C3');
  });

  it('оставляет недописанный код', () => {
    expect(getCustomThemeHexFieldText('#a1b2', '#a1b2c3')).toBe('#a1b2');
    expect(getCustomThemeHexFieldText('#a1x', '#a1b2c3')).toBe('#a1x');
  });

  it('оставляет верный набор, пока он совпадает с цветом', () => {
    expect(getCustomThemeHexFieldText('abc', '#aabbcc')).toBe('abc');
  });

  it('показывает новый цвет, если его сменили иначе', () => {
    expect(getCustomThemeHexFieldText('abc', '#112233')).toBe('#112233');
  });
});
